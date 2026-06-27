"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SKILL_LIST, SKILLS, type PromptType } from "@/lib/skills";
import type {
  Answers,
  GeneratedPrompt,
  HistoryEntry,
  ImageAnalysis,
} from "@/lib/types";
import {
  isTypeConfigured,
  providerDisplayName,
  providerEnvKey,
  providerForType,
} from "@/lib/providers";
import { loadModelPrefs, selectedModel, selectedModelLabel, type ModelPrefs } from "@/lib/model-prefs";
import { loadOverrides, type Overrides } from "@/lib/overrides";
import ModelSelect from "@/components/ModelSelect";
import { Icon, Logo, type IconName } from "@/components/icons";
import PromptForm from "@/components/PromptForm";
import type { ImageUploaderHandle } from "@/components/ImageUploader";
import ResultPanel, { type SaveState } from "@/components/ResultPanel";
import HistoryPanel from "@/components/HistoryPanel";

function defaultAnswers(type: PromptType): Answers {
  const answers: Answers = {};
  for (const f of SKILLS[type].fields) {
    if (f.defaultValue !== undefined) answers[f.name] = f.defaultValue;
  }
  return answers;
}

export default function Home() {
  const [type, setType] = useState<PromptType>("image");
  const [answersByType, setAnswersByType] = useState<Record<string, Answers>>({
    image: defaultAnswers("image"),
    video: defaultAnswers("video"),
    code: defaultAnswers("code"),
    ai: defaultAnswers("ai"),
  });
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<
    "idle" | "analyzing" | "generating"
  >("idle");
  const imageUploaderRef = useRef<ImageUploaderHandle>(null);
  const loading = loadingPhase !== "idle";
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [config, setConfig] = useState({
    anthropic: false,
    gemini: false,
    sheets: false,
    models: {
      gemini: "gemini-2.5-flash",
      anthropic: "claude-opus-4-8",
      geminiLabel: "2.5 Flash",
      anthropicLabel: "Opus 4.8",
    },
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [modelPrefs, setModelPrefs] = useState<ModelPrefs>({});
  const [historyKey, setHistoryKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(true); // aberto por padrão
  const [overrides, setOverrides] = useState<Overrides>({});
  const [showResult, setShowResult] = useState(false);

  const skill = SKILLS[type];
  const answers = answersByType[type];
  const concept = (answers.concept as string) ?? "";
  const conceptPlaceholder =
    skill.fields.find((f) => f.name === "concept")?.placeholder ??
    "Descreva o que você quer criar…";

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {})
      .finally(() => setConfigLoading(false));
    setOverrides(loadOverrides());
    setModelPrefs(loadModelPrefs());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const conceptFilled = useMemo(() => concept.trim().length > 0, [concept]);
  const providerReady = isTypeConfigured(type, config);
  const activeProvider = providerForType(type);
  const activeEnvKey = providerEnvKey(activeProvider);
  const geminiModel = selectedModel("gemini", modelPrefs, config.models.gemini);
  const anthropicModel = selectedModel(
    "anthropic",
    modelPrefs,
    config.models.anthropic
  );
  const activeModel =
    activeProvider === "gemini" ? geminiModel : anthropicModel;
  const activeModelLabel = selectedModelLabel(
    activeProvider,
    modelPrefs,
    activeProvider === "gemini" ? config.models.gemini : config.models.anthropic
  );

  const setAnswer = (name: string, value: string | boolean) =>
    setAnswersByType((prev) => ({
      ...prev,
      [type]: { ...prev[type], [name]: value },
    }));

  const switchType = (t: PromptType) => {
    setType(t);
    imageUploaderRef.current?.reset();
    setResult(null);
    setError(null);
    setSaveState("idle");
    setShowResult(false);
  };

  const restoreFromHistory = (entry: HistoryEntry) => {
    setType(entry.type);
    setAnswersByType((prev) => ({
      ...prev,
      [entry.type]: { ...defaultAnswers(entry.type), concept: entry.concept },
    }));
    imageUploaderRef.current?.reset();
    setResult({
      prompt: entry.prompt,
      assumptions: [],
      notes: "",
    });
    setError(null);
    setSaveState("idle");
    setShowResult(true);
    setDrawerOpen(false);
  };

  const generateBlocked = !conceptFilled || loading || !providerReady;

  const generate = async () => {
    if (generateBlocked) return;
    setShowResult(true);
    setError(null);
    setResult(null);
    setSaveState("idle");
    try {
      let imageAnalyses: ImageAnalysis[] = [];
      if (
        skill.supportsImages &&
        imageUploaderRef.current?.hasImages()
      ) {
        setLoadingPhase("analyzing");
        imageAnalyses = await imageUploaderRef.current.analyzeAll();
      }

      setLoadingPhase("generating");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          answers,
          images: imageAnalyses,
          systemOverride: overrides[type],
          modelOverride: activeModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na geração");
      const generated = data as GeneratedPrompt;
      setResult(generated);
      autoSave(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoadingPhase("idle");
    }
  };

  // Salva automaticamente cada prompt gerado na planilha/histórico.
  const autoSave = (generated: GeneratedPrompt) => {
    if (!config.sheets) {
      setSaveState("off");
      return;
    }
    setSaveState("saving");
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, concept, prompt: generated.prompt }),
    })
      .then((r) => {
        if (r.ok) {
          setSaveState("saved");
          setHistoryKey((k) => k + 1);
        } else {
          setSaveState("idle");
        }
      })
      .catch(() => setSaveState("idle"));
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ============ Topo discreto ============ */}
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-line/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setError(null);
              setShowResult(false);
            }}
            className="flex items-center gap-2"
            aria-label="Início"
          >
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-accent-on">
              <Logo size={16} />
            </span>
            <span className="font-display text-[1.02rem] font-semibold tracking-tight">
              PerfectPrompt
            </span>
          </button>

          <div className="flex items-center gap-1">
            <DockItem label="Configurações" icon="settings" href="/configuracoes" />
            <DockItem
              label="Histórico"
              icon="history"
              onClick={() => setDrawerOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* ============ Workspace — duas colunas ============ */}
      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-7 sm:py-9">
          {!providerReady && (
            <div className="panel rise p-4 mb-5 border-l-2 border-l-danger flex gap-3">
              <Icon name="info" size={18} className="text-danger shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-ink">Falta configurar a API key</p>
                <p className="text-muted mt-0.5">
                  Crie <code className="font-mono text-xs">.env.local</code> com{" "}
                  <code className="font-mono text-xs">{activeEnvKey}</code> para{" "}
                  {type === "image" || type === "video"
                    ? "prompts de imagem e vídeo (Gemini)"
                    : "prompts de código e IA (Claude)"}{" "}
                  e reinicie o servidor.
                </p>
              </div>
            </div>
          )}

          <div
            className={`grid gap-6 items-start ${
              showResult
                ? "grid-cols-1 lg:grid-cols-2 w-full"
                : "grid-cols-1 w-full max-w-2xl mx-auto"
            }`}
          >
            {/* ---- ESQUERDA: compositor + filtros ---- */}
            <section aria-label="Compositor" className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-display text-[1.55rem] font-semibold tracking-tight leading-tight">
                    O que você quer criar?
                  </h1>
                  <p className="text-muted text-sm mt-1">
                    Descreva sua ideia. A IA refina no prompt perfeito.
                  </p>
                </div>
                <ProviderBadge
                  type={type}
                  config={config}
                  loading={configLoading}
                  provider={activeProvider}
                  modelId={activeModel}
                  onModelPrefs={setModelPrefs}
                />
              </div>

              {/* Composer (sem contorno no foco) */}
              <div className="rounded-[1.4rem] border border-line-strong bg-panel shadow-[var(--sh-2)]">
                <textarea
                  className="composer-input w-full bg-transparent resize-none px-5 pt-4 pb-2 text-[0.98rem] leading-relaxed text-ink placeholder:text-faint outline-none"
                  rows={3}
                  placeholder={conceptPlaceholder}
                  value={concept}
                  onChange={(e) => setAnswer("concept", e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
                  }}
                  aria-label="Descreva o que você quer criar"
                />
                <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {SKILL_LIST.map((s) => {
                      const active = type === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => switchType(s.id)}
                          aria-pressed={active}
                          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[0.8rem] font-medium transition-all ${
                            active
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-transparent text-muted hover:bg-inset hover:text-ink"
                          }`}
                        >
                          <Icon name={s.icon} size={15} />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="ml-auto shrink-0">
                    <button
                      type="button"
                      onClick={generate}
                      disabled={generateBlocked}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary font-medium text-sm pl-3.5 pr-3 py-2 transition-all hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      {loadingPhase === "analyzing" ? (
                        <>
                          <span className="spinner" /> Analisando
                        </>
                      ) : loadingPhase === "generating" ? (
                        <>
                          <span className="spinner" /> Gerando
                        </>
                      ) : (
                        <>
                          Gerar
                          <Icon name="arrow-right" size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtros de refino (abertos por padrão) */}
              <div className="panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRefineOpen((v) => !v)}
                  aria-expanded={refineOpen}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-ink hover:bg-panel-2 transition-colors"
                >
                  <Icon name="sliders" size={16} className="text-muted" />
                  Refinar
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={`ml-auto text-muted transition-transform ${
                      refineOpen ? "" : "-rotate-90"
                    }`}
                  />
                </button>
                {refineOpen && (
                  <div className="px-4 pb-5 pt-1 border-t border-line">
                    <PromptForm
                      ref={imageUploaderRef}
                      skill={skill}
                      answers={answers}
                      onAnswer={setAnswer}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ---- DIREITA: resultado (só após gerar) ---- */}
            {showResult && (
              <section
                aria-label="Resultado"
                className="lg:sticky lg:top-20 lg:self-start"
              >
                <ResultPanel
                  result={result}
                  loading={loading}
                  error={error}
                  saveState={saveState}
                />
              </section>
            )}
          </div>

          <footer className="mt-12 pt-6 border-t border-line text-xs text-faint flex flex-wrap items-center justify-between gap-2">
            <span>
              Engenharia de prompt por{" "}
              <span className="text-muted">
                {providerDisplayName(activeProvider)} {activeModelLabel}
              </span>
            </span>
            <span className="font-mono">PerfectPrompt</span>
          </footer>
        </div>
      </main>

      {/* ============ Drawer de histórico ============ */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-ink/25 z-30 fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Histórico de prompts"
            className="fixed right-0 top-0 h-dvh w-full max-w-[400px] bg-panel border-l border-line z-40 drawer-enter flex flex-col shadow-[var(--sh-3)]"
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
              <span className="flex items-center gap-2 font-display text-lg font-semibold">
                <Icon name="history" size={18} className="text-accent" />
                Histórico
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn-quiet rounded-lg p-2"
                aria-label="Fechar histórico"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <HistoryPanel
                configured={config.sheets}
                refreshKey={historyKey}
                onRestore={restoreFromHistory}
              />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

/** Tag discreta — IA ativa + seletor de modelo (canto superior direito). */
function ProviderBadge({
  type,
  config,
  loading,
  provider,
  modelId,
  onModelPrefs,
}: {
  type: PromptType;
  config: { anthropic: boolean; gemini: boolean };
  loading: boolean;
  provider: ReturnType<typeof providerForType>;
  modelId: string;
  onModelPrefs: (prefs: ModelPrefs) => void;
}) {
  const connected = isTypeConfigured(type, config);
  const statusLabel = loading
    ? "Verificando conexão"
    : connected
      ? "Conectado"
      : "Desconectado";

  return (
    <div
      className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-[0.72rem] text-faint"
      role="status"
      aria-live="polite"
      aria-label={`${providerDisplayName(provider)} — ${statusLabel}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
          loading
            ? "bg-line-strong animate-pulse"
            : connected
              ? "bg-[#2d9a5f]"
              : "bg-danger"
        }`}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap inline-flex items-center gap-0.5">
        <span className="text-muted">{providerDisplayName(provider)}</span>
        <span className="hidden sm:inline text-faint">·</span>
        <ModelSelect
          provider={provider}
          value={modelId}
          onChange={onModelPrefs}
          compact
        />
      </span>
    </div>
  );
}

/** Item de dock no topo — só ícone; título no hover. Link ou botão. */
function DockItem({
  label,
  icon,
  href,
  onClick,
}: {
  label: string;
  icon: IconName;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "grid place-items-center w-9 h-9 rounded-lg text-muted hover:text-ink hover:bg-inset transition-colors";
  return (
    <div className="relative group">
      {href ? (
        <Link href={href} aria-label={label} className={cls}>
          <Icon name={icon} size={19} />
        </Link>
      ) : (
        <button type="button" onClick={onClick} aria-label={label} className={cls}>
          <Icon name={icon} size={19} />
        </button>
      )}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 mt-1.5 whitespace-nowrap rounded-md bg-ink text-on-primary text-xs px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
      >
        {label}
      </span>
    </div>
  );
}
