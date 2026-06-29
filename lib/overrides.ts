import type { PromptType } from "./skills";

/**
 * Overrides do system prompt ("comando da skill") por tipo, editados na página
 * de Configurações. Guardados no navegador (localStorage) e, se a planilha
 * estiver configurada, sincronizados na aba "Skills".
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

export function persistOverrides(overrides: Overrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(overrides));
}

export function saveOverride(type: PromptType, value: string): void {
  if (typeof window === "undefined") return;
  const o = loadOverrides();
  if (value.trim()) o[type] = value;
  else delete o[type];
  persistOverrides(o);
}

/** Mescla overrides da planilha com o localStorage (planilha prevalece). */
export function mergeSheetOverrides(sheetOverrides: Overrides): Overrides {
  const merged = { ...loadOverrides(), ...sheetOverrides };
  persistOverrides(merged);
  return merged;
}

/** Busca overrides na planilha e aplica no localStorage. */
export async function fetchAndApplySkillOverrides(): Promise<Overrides> {
  try {
    const res = await fetch("/api/skills");
    const data = (await res.json()) as {
      configured?: boolean;
      overrides?: Overrides;
    };
    if (!data.configured || !data.overrides) return loadOverrides();
    return mergeSheetOverrides(data.overrides);
  } catch {
    return loadOverrides();
  }
}

/** Envia override para a planilha (silencioso se falhar). */
export async function syncSkillOverrideToSheets(
  type: PromptType,
  value: string
): Promise<void> {
  try {
    await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, system: value }),
    });
  } catch {
    /* localStorage já tem o valor */
  }
}
