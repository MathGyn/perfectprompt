import { SKILLS, type PromptType } from "./skills";

/**
 * Cache local das skills (espelho da aba "Skills" da planilha).
 * Quando a planilha está configurada, ela é a fonte de verdade — o servidor
 * lê direto dela na geração; o localStorage só acelera a UI.
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

/** Guarda o prompt completo da skill no cache local. */
export function saveSkillPrompt(type: PromptType, system: string): void {
  if (typeof window === "undefined") return;
  const o = loadOverrides();
  o[type] = system;
  persistOverrides(o);
}

/** Prompt efetivo: planilha/cache → padrão do código. */
export function getSkillPrompt(
  type: PromptType,
  overrides?: Overrides
): string {
  const cached = (overrides ?? loadOverrides())[type]?.trim();
  return cached || SKILLS[type].system;
}

/** Substitui o cache local pelo conteúdo da planilha (sem mesclar). */
export function applySheetAsSource(sheetSkills: Overrides): Overrides {
  persistOverrides(sheetSkills);
  return sheetSkills;
}

/** Busca skills na planilha e aplica como cache local. */
export async function fetchAndApplySkillOverrides(): Promise<{
  overrides: Overrides;
  configured: boolean;
  error?: string;
}> {
  try {
    const res = await fetch("/api/skills");
    const data = (await res.json()) as {
      configured?: boolean;
      overrides?: Overrides;
      error?: string;
    };
    if (!data.configured) {
      return { overrides: loadOverrides(), configured: false };
    }
    if (!res.ok) {
      return {
        overrides: loadOverrides(),
        configured: true,
        error: data.error ?? "Erro ao ler skills da planilha.",
      };
    }
    return {
      overrides: applySheetAsSource(data.overrides ?? {}),
      configured: true,
    };
  } catch {
    return {
      overrides: loadOverrides(),
      configured: false,
      error: "Falha ao conectar com /api/skills.",
    };
  }
}

/** Envia o prompt completo para a planilha. Falha com erro explícito. */
export async function syncSkillToSheets(
  type: PromptType,
  system: string
): Promise<void> {
  const res = await fetch("/api/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, system }),
  });
  const data = (await res.json()) as { error?: string; ok?: boolean };
  if (!res.ok) {
    throw new Error(
      data.error ??
        (res.status === 503
          ? "Planilha não configurada (SHEETS_WEBAPP_URL)."
          : "Erro ao salvar skill na planilha.")
    );
  }
}

/** @deprecated use saveSkillPrompt */
export function saveOverride(type: PromptType, value: string): void {
  saveSkillPrompt(type, value);
}
