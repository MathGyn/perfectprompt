"use client";

import { useEffect, useState, useCallback } from "react";
import type { HistoryEntry } from "@/lib/types";
import { SKILLS } from "@/lib/skills";
import { Icon } from "@/components/icons";

export default function HistoryPanel({
  configured,
  refreshKey,
  onRestore,
}: {
  configured: boolean;
  refreshKey: number;
  onRestore: (entry: HistoryEntry) => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar");
      setEntries(data.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleFav = useCallback(async (entry: HistoryEntry) => {
    const next = !entry.favorite;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, favorite: next } : e))
    );
    try {
      await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, favorite: next }),
      });
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, favorite: !next } : e))
      );
    }
  }, []);

  const remove = useCallback(async (entry: HistoryEntry) => {
    let snapshot: HistoryEntry[] = [];
    setEntries((prev) => {
      snapshot = prev;
      return prev.filter((e) => e.id !== entry.id);
    });
    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEntries(snapshot); // reverte
      setError("Não foi possível excluir. Tente novamente.");
    }
  }, []);

  if (!configured) {
    return (
      <div className="text-center py-10 px-4">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-inset text-faint mx-auto mb-3">
          <Icon name="history" size={22} />
        </span>
        <p className="text-sm font-medium text-ink mb-1">Histórico desativado</p>
        <p className="text-sm text-muted leading-relaxed max-w-[16rem] mx-auto">
          Conecte uma planilha do Google (variável{" "}
          <code className="font-mono text-xs">SHEETS_WEBAPP_URL</code>) para
          salvar e favoritar prompts. Veja o README.
        </p>
      </div>
    );
  }

  const shown = onlyFav ? entries.filter((e) => e.favorite) : entries;
  const favCount = entries.filter((e) => e.favorite).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOnlyFav((v) => !v)}
          aria-pressed={onlyFav}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            onlyFav
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-line-strong text-muted hover:text-ink"
          }`}
        >
          <Icon name={onlyFav ? "star-filled" : "star"} size={14} />
          Favoritos
          {favCount > 0 && <span className="tnum">· {favCount}</span>}
        </button>
        <button
          type="button"
          onClick={load}
          className="btn-quiet rounded-lg p-2"
          aria-label="Atualizar histórico"
        >
          <Icon name="refresh" size={16} />
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel p-3 flex gap-2.5 items-center">
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-[80%]" />
                <div className="skeleton h-2.5 w-[40%]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="text-center py-10 text-sm text-muted">
          {onlyFav
            ? "Nenhum favorito ainda."
            : "Nenhum prompt salvo ainda. Gere um e salve aqui."}
        </div>
      )}

      <div className="space-y-2">
        {shown.map((e) => (
          <HistoryCard
            key={e.id}
            entry={e}
            onToggleFav={() => toggleFav(e)}
            onDelete={() => remove(e)}
            onRestore={() => onRestore(e)}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({
  entry,
  onToggleFav,
  onDelete,
  onRestore,
}: {
  entry: HistoryEntry;
  onToggleFav: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const skill = SKILLS[entry.type];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const restore = () => {
    onRestore();
    setOpen(false);
  };

  return (
    <div
      className="panel p-3 transition-colors hover:border-line-strong group cursor-default"
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        restore();
      }}
      title="Clique duplo para restaurar no formulário"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-inset text-ink-soft shrink-0">
          <Icon name={skill?.icon ?? "sparkle"} size={16} />
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            restore();
          }}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <p className="text-sm text-ink truncate">
            {entry.concept || "(sem conceito)"}
          </p>
          <p className="text-xs text-faint tnum mt-0.5">
            {new Date(entry.createdAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </button>
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleFav}
            className={`p-1 transition-transform active:scale-90 ${
              entry.favorite ? "text-accent" : "text-faint hover:text-accent"
            }`}
            title={entry.favorite ? "Remover dos favoritos" : "Favoritar"}
            aria-pressed={entry.favorite}
          >
            <Icon name={entry.favorite ? "star-filled" : "star"} size={17} />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="p-1 text-faint hover:text-danger transition-colors"
            title="Excluir do histórico"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {confirming && (
        <div className="mt-2.5 pt-2.5 border-t border-line flex items-center justify-between gap-2 fade-in">
          <span className="text-xs text-ink-soft">Excluir este prompt?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-inset"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
              className="rounded-md px-2 py-1 text-xs font-medium bg-danger text-white inline-flex items-center gap-1"
            >
              <Icon name="trash" size={13} />
              Excluir
            </button>
          </div>
        </div>
      )}

      {open && !confirming && (
        <div className="mt-2.5 pt-2.5 border-t border-line rise">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words text-muted max-h-52 overflow-y-auto leading-relaxed">
            {entry.prompt}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent mt-2 transition-colors"
          >
            <Icon name={copied ? "check" : "copy"} size={13} />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
