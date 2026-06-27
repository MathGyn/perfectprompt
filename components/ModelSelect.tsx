"use client";

import {
  optionsForProvider,
  type ModelPrefs,
  saveModelPref,
} from "@/lib/model-prefs";
import type { LlmProvider } from "@/lib/providers";
import { Icon } from "@/components/icons";

/** Seletor compacto de modelo — badge na home ou configurações. */
export default function ModelSelect({
  provider,
  value,
  onChange,
  compact = false,
}: {
  provider: LlmProvider;
  value: string;
  onChange: (prefs: ModelPrefs) => void;
  compact?: boolean;
}) {
  const options = optionsForProvider(provider);

  if (compact) {
    return (
      <label className="inline-flex items-center gap-0.5 cursor-pointer group">
        <select
          value={value}
          onChange={(e) => onChange(saveModelPref(provider, e.target.value))}
          className="appearance-none bg-transparent text-muted text-[0.72rem] font-medium pr-3 pl-0 py-0 border-0 outline-none cursor-pointer max-w-[7.5rem] truncate hover:text-ink focus:text-ink"
          aria-label={`Modelo ${provider === "gemini" ? "Gemini" : "Claude"}`}
        >
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={11}
          className="text-faint -ml-2.5 pointer-events-none group-hover:text-muted"
        />
      </label>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(saveModelPref(provider, m.id))}
            aria-pressed={active}
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              active
                ? "border-accent bg-accent-soft text-accent"
                : "border-line-strong bg-panel text-ink-soft hover:bg-panel-2"
            }`}
          >
            <span className="block text-sm font-medium">{m.label}</span>
            <span
              className={`block text-xs mt-0.5 ${active ? "text-accent/80" : "text-faint"}`}
            >
              {m.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
