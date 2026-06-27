import type { PromptType } from "./skills";

/**
 * Overrides do system prompt ("comando da skill") por tipo, editados na página
 * de Configurações e guardados no navegador (localStorage). Vazio = usa o
 * padrão de lib/skills.ts no servidor.
 */
const KEY = "pp_skill_overrides";

export type Overrides = Partial<Record<PromptType, string>>;

export function loadOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Overrides;
  } catch {
    return {};
  }
}

export function saveOverride(type: PromptType, value: string): void {
  if (typeof window === "undefined") return;
  const o = loadOverrides();
  if (value.trim()) o[type] = value;
  else delete o[type];
  localStorage.setItem(KEY, JSON.stringify(o));
}
