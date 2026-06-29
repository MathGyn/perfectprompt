"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SKILL_LIST, SKILLS, type PromptType } from "@/lib/skills";
import { loadOverrides, saveOverride, syncSkillOverrideToSheets, fetchAndApplySkillOverrides } from "@/lib/overrides";
import {
  loadModelPrefs,
  selectedModel,
  type ModelPrefs,
} from "@/lib/model-prefs";
import ModelSelect from "@/components/ModelSelect";
import { Icon, Logo } from "@/components/icons";

export default function ConfiguracoesPage() {
  const [type, setType] = useState<PromptType>("image");
  const [value, setValue] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modelPrefs, setModelPrefs] = useState<ModelPrefs>({});
  const [serverModels, setServerModels] = useState({
    gemini: "gemini-2.5-flash",
    anthropic: "claude-opus-4-8",
  });
  const [sheetsConfigured, setSheetsConfigured] = useState(false);

  const skill = SKILLS[type];
  const defaultPrompt = skill.system;
  const customized = value.trim() !== "" && value !== defaultPrompt;

  useEffect(() => {
    setModelPrefs(loadModelPrefs());
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.models) {
          setServerModels({
            gemini: data.models.gemini,
            anthropic: data.models.anthropic,
          });
        }
        setSheetsConfigured(Boolean(data.sheets));
      })
      .catch(() => {});
    fetchAndApplySkillOverrides().then(() => {
      const o = loadOverrides();
      setValue(o[type] ?? defaultPrompt);
    });
  }, []);

  // Carrega o valor (override ou padrão) ao trocar de tipo.
  useEffect(() => {
    const o = loadOverrides();
    setValue(o[type] ?? defaultPrompt);
  }, [type, defaultPrompt]);

  const update = (next: string) => {
    setValue(next);
    const stored = next === defaultPrompt ? "" : next;
    saveOverride(type, stored);
    if (sheetsConfigured) {
      void syncSkillOverrideToSheets(type, stored);
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  };

  const restore = () => update(defaultPrompt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Topo */}
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-line/70">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="grid place-items-center w-9 h-9 -ml-1 rounded-lg text-muted hover:text-ink hover:bg-inset transition-colors"
            aria-label="Voltar"
          >
            <Icon name="arrow-left" size={19} />
          </Link>
          <span className="flex items-center gap-2">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-accent-on">
              <Logo size={15} />
            </span>
            <span className="font-display text-[1.02rem] font-semibold tracking-tight">
              Configurações
            </span>
          </span>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-6">
            <p className="eyebrow mb-1.5">comando da skill</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Instruções por tipo de prompt
            </h1>
            <p className="text-muted mt-2 text-[0.95rem] leading-relaxed max-w-xl">
              Este é o comando que orienta a IA ao gerar cada tipo de prompt
              (o “system prompt” da skill). Edite para ajustar o comportamento.
              As mudanças valem para as próximas gerações e ficam salvas neste
              navegador.
            </p>
          </div>

          {/* Modelos de IA */}
          <div className="mb-8 panel p-5 space-y-5">
            <div>
              <p className="eyebrow mb-1.5">modelos de ia</p>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Qual modelo usar
              </h2>
              <p className="text-muted text-sm mt-1.5 leading-relaxed max-w-xl">
                Gemini para imagem e vídeo; Claude para código e IA/texto. A
                escolha fica salva neste navegador.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-ink mb-2">Gemini</p>
              <ModelSelect
                provider="gemini"
                value={selectedModel("gemini", modelPrefs, serverModels.gemini)}
                onChange={setModelPrefs}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-ink mb-2">Claude</p>
              <ModelSelect
                provider="anthropic"
                value={selectedModel(
                  "anthropic",
                  modelPrefs,
                  serverModels.anthropic
                )}
                onChange={setModelPrefs}
              />
            </div>
          </div>

          {/* Seletor de tipo */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SKILL_LIST.map((s) => {
              const active = type === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setType(s.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line-strong text-ink-soft hover:bg-panel-2"
                  }`}
                >
                  <Icon name={s.icon} size={15} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Editor */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line bg-panel-2">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-muted">Skill:</span>
                <span className="font-medium text-ink">{skill.label}</span>
                {customized ? (
                  <span className="text-xs rounded-full bg-accent-soft text-accent px-2 py-0.5">
                    personalizado
                  </span>
                ) : (
                  <span className="text-xs text-faint">padrão</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {savedFlash && (
                  <span className="text-xs text-accent flex items-center gap-1 mr-1">
                    <Icon name="check" size={13} /> salvo
                  </span>
                )}
                <button
                  type="button"
                  onClick={copy}
                  className="btn-quiet rounded-lg px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Icon name={copied ? "check" : "copy"} size={14} />
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={restore}
                  disabled={!customized}
                  className="btn-quiet rounded-lg px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Icon name="refresh" size={14} />
                  Restaurar padrão
                </button>
              </div>
            </div>
            <textarea
              value={value}
              onChange={(e) => update(e.target.value)}
              spellCheck={false}
              className="w-full bg-panel resize-y min-h-[460px] px-4 py-4 text-[0.82rem] font-mono leading-relaxed text-ink outline-none"
              aria-label={`Comando da skill: ${skill.label}`}
            />
          </div>

          <p className="text-xs text-faint mt-3">
            {value.length.toLocaleString("pt-BR")} caracteres · guardado no
            navegador (localStorage)
            {sheetsConfigured ? " e na aba Skills da planilha" : ""}. Restaurar
            volta ao comando original.
          </p>
        </div>
      </main>
    </div>
  );
}
