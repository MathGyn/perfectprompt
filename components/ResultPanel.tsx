"use client";

import { useState } from "react";
import type { GeneratedPrompt } from "@/lib/types";
import { Icon, Logo } from "@/components/icons";

export type SaveState = "idle" | "saving" | "saved" | "off";

export default function ResultPanel({
  result,
  loading,
  error,
  saveState,
}: {
  result: GeneratedPrompt | null;
  loading: boolean;
  error: string | null;
  saveState: SaveState;
}) {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="skeleton h-2.5 w-20" />
            <div className="skeleton h-2.5 w-10" />
          </div>
          <div className="px-4 py-4 space-y-2.5">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-[94%]" />
            <div className="skeleton h-3 w-[98%]" />
            <div className="skeleton h-3 w-[80%]" />
            <div className="skeleton h-3 w-[90%]" />
          </div>
        </div>
        <p className="text-xs text-muted flex items-center gap-2">
          <span className="spinner text-accent" /> Aplicando prompt engineering…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel rise p-6 border-l-2 border-l-danger min-h-[140px]">
        <p className="text-danger font-medium text-sm flex items-center gap-2">
          <Icon name="info" size={16} /> Algo deu errado
        </p>
        <p className="text-muted text-sm mt-1.5">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel-flat flex flex-col items-center justify-center gap-4 text-center min-h-[340px] p-8">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-accent-soft text-accent">
          <Logo size={24} />
        </span>
        <p className="text-muted text-sm max-w-[16rem] leading-relaxed">
          Descreva sua ideia à esquerda e gere. O prompt aparece aqui — pronto
          para copiar, e salvo no histórico automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rise">
      <PromptBox label="Prompt" text={result.prompt} accent />
      <SaveStatus state={saveState} />
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === "saving")
    return (
      <p className="text-xs text-muted flex items-center gap-1.5">
        <span className="spinner text-accent" style={{ width: 12, height: 12 }} />
        Salvando no histórico…
      </p>
    );
  if (state === "saved")
    return (
      <p className="text-xs text-muted flex items-center gap-1.5">
        <Icon name="check" size={13} className="text-accent" />
        Salvo no histórico
      </p>
    );
  if (state === "off")
    return (
      <p className="text-xs text-faint">
        Histórico desativado (planilha não configurada).
      </p>
    );
  return null;
}

function PromptBox({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-panel-2">
        <span className="eyebrow">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent transition-colors"
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre
        className={`px-4 py-4 text-[0.82rem] font-mono whitespace-pre-wrap break-words text-ink leading-[1.7] ${
          accent ? "border-l-2 border-l-accent" : ""
        }`}
      >
        {text}
      </pre>
    </div>
  );
}
