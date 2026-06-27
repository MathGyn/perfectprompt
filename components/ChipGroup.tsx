"use client";

import { useState } from "react";

/**
 * Seleção por chips (substitui o <select>). Uma opção selecionável por vez.
 * Quando há "Outro", o próprio chip vira um campo editável ao ser clicado.
 */
export default function ChipGroup({
  label,
  help,
  options,
  value,
  onChange,
  allowCustom,
}: {
  label: string;
  help?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
}) {
  const isKnown = options.some((o) => o.value === value);
  const [custom, setCustom] = useState(value !== "" && !isKnown);

  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      {help && <p className="text-xs text-muted mt-0.5 leading-snug">{help}</p>}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {options.map((o) => {
          const active = !custom && value === o.value;
          return (
            <Chip
              key={o.value}
              active={active}
              onClick={() => {
                setCustom(false);
                onChange(o.value);
              }}
            >
              {o.label}
            </Chip>
          );
        })}

        {allowCustom &&
          (custom ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="digite…"
              size={Math.max(8, value.length + 1)}
              className="field rounded-full px-3 py-1.5 text-[0.82rem] font-medium !py-1.5 !px-3 !w-auto outline-none"
              onBlur={() => {
                if (value.trim() === "") setCustom(false);
              }}
            />
          ) : (
            <Chip active={false} onClick={() => {
              onChange("");
              setCustom(true);
            }}>
              Outro…
            </Chip>
          ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-[0.82rem] font-medium border transition-all active:scale-[0.97] ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line-strong bg-panel text-ink-soft hover:bg-panel-2"
      }`}
    >
      {children}
    </button>
  );
}
