"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ImageAnalysis } from "@/lib/types";
import { compressImageForAnalysis } from "@/lib/compress-image";
import { Icon } from "@/components/icons";

type Role = "style" | "content";
type Status = "pending" | "analyzing" | "done" | "error";

interface Ref {
  id: string;
  name: string;
  previewUrl: string;
  base64: string;
  mediaType: string;
  role: Role;
  status: Status;
  analysis?: ImageAnalysis;
  error?: string;
}

export interface ImageUploaderHandle {
  hasImages: () => boolean;
  /** Analisa todas as referências (chamado ao gerar o prompt). */
  analyzeAll: () => Promise<ImageAnalysis[]>;
  reset: () => void;
}

const SUPPORTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const ImageUploader = forwardRef<ImageUploaderHandle>(function ImageUploader(
  _props,
  ref
) {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const refsRef = useRef(refs);
  refsRef.current = refs;

  const analyzeOne = useCallback(async (item: Ref): Promise<ImageAnalysis> => {
    const res = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64: item.base64,
        mediaType: item.mediaType,
        role: item.role,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha na análise");
    return data as ImageAnalysis;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      hasImages: () => refsRef.current.length > 0,
      reset: () => setRefs([]),
      analyzeAll: async () => {
        const current = refsRef.current;
        if (current.length === 0) return [];

        const results: ImageAnalysis[] = [];

        for (const item of current) {
          const live = refsRef.current.find((r) => r.id === item.id) ?? item;

          if (
            live.status === "done" &&
            live.analysis &&
            live.analysis.role === live.role
          ) {
            results.push(live.analysis);
            continue;
          }

          setRefs((prev) =>
            prev.map((r) =>
              r.id === live.id
                ? { ...r, status: "analyzing" as Status, error: undefined }
                : r
            )
          );
          try {
            const analysis = await analyzeOne(live);
            results.push(analysis);
            setRefs((prev) =>
              prev.map((r) =>
                r.id === live.id
                  ? { ...r, status: "done" as Status, analysis }
                  : r
              )
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro";
            setRefs((prev) =>
              prev.map((r) =>
                r.id === live.id
                  ? { ...r, status: "error" as Status, error: msg }
                  : r
              )
            );
            throw err;
          }
        }

        return results;
      },
    }),
    [analyzeOne]
  );

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!SUPPORTED.includes(file.type)) continue;
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const { base64, mediaType } = await compressImageForAnalysis(file);
      const entry: Ref = {
        id,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        base64,
        mediaType,
        role: "style",
        status: "pending",
      };
      setRefs((prev) => [...prev, entry]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const changeRole = useCallback((id: string, role: Role) => {
    setRefs((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              role,
              status: "pending" as Status,
              analysis: undefined,
              error: undefined,
            }
          : r
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setRefs((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-ink">
          Imagens de referência{" "}
          <span className="text-faint font-normal">(opcional)</span>
        </p>
        <p className="text-xs text-muted mt-1 leading-snug">
          Marque cada imagem como <strong className="text-ink-soft">estilo</strong>{" "}
          (só a vibe) ou{" "}
          <strong className="text-ink-soft">conteúdo</strong> (o sujeito). A
          análise acontece ao clicar em{" "}
          <strong className="text-ink-soft">Gerar</strong>.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        className={`w-full flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
          dragOver
            ? "border-ink-soft bg-inset text-ink"
            : "border-line-strong bg-inset/50 text-muted hover:text-ink hover:border-line-strong"
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Icon name="image-plus" size={18} />
        {dragOver ? "Solte a imagem aqui" : "Adicionar imagem ou arraste aqui"}
      </div>

      {refs.length > 0 && (
        <div className="space-y-2">
          {refs.map((r) => (
            <div
              key={r.id}
              className="flex gap-3 rounded-xl border border-line bg-panel-2 p-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.previewUrl}
                alt={`Referência: ${r.name}`}
                className="h-16 w-16 shrink-0 rounded-lg object-cover border border-line"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <RolePill
                    active={r.role === "style"}
                    disabled={r.status === "analyzing"}
                    onClick={() => r.role !== "style" && changeRole(r.id, "style")}
                  >
                    Estilo
                  </RolePill>
                  <RolePill
                    active={r.role === "content"}
                    disabled={r.status === "analyzing"}
                    onClick={() =>
                      r.role !== "content" && changeRole(r.id, "content")
                    }
                  >
                    Conteúdo
                  </RolePill>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={r.status === "analyzing"}
                    className="ml-auto text-faint hover:text-danger p-1 disabled:opacity-40"
                    aria-label="Remover imagem"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>
                <Analysis r={r} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ImageUploader;

function RolePill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-accent text-accent-on"
          : "bg-panel text-muted border border-line-strong hover:border-accent-line"
      }`}
    >
      {children}
    </button>
  );
}

function Analysis({ r }: { r: Ref }) {
  if (r.status === "analyzing")
    return (
      <p className="text-xs text-muted flex items-center gap-1.5">
        <span className="spinner text-accent" style={{ width: 12, height: 12 }} />
        Analisando…
      </p>
    );
  if (r.status === "error")
    return <p className="text-xs text-danger">{r.error}</p>;
  if (r.status === "done" && r.analysis) {
    const attrs =
      r.role === "style"
        ? r.analysis.styleAttributes
        : r.analysis.contentAttributes;
    if (attrs.length > 0) {
      return (
        <p className="text-xs text-muted leading-snug">
          <span className="text-faint">
            {r.role === "style" ? "Estilo: " : "Conteúdo: "}
          </span>
          {attrs.slice(0, 4).join(" · ")}
          {attrs.length > 4 ? "…" : ""}
        </p>
      );
    }
  }
  return (
    <p className="text-xs text-faint">
      {r.role === "style" ? "Estilo" : "Conteúdo"} · aguardando geração
    </p>
  );
}
