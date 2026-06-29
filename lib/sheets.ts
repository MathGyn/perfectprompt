import type { HistoryEntry } from "./types";
import type { PromptType } from "./skills";

/**
 * Integração com Google Sheets via Apps Script Web App.
 *
 * A planilha continua sendo uma planilha normal; o Apps Script expõe uma URL
 * secreta (SHEETS_WEBAPP_URL) que a app usa para ler/escrever. Sem essa URL, o
 * histórico simplesmente não persiste (a app continua funcionando).
 *
 * Veja google-apps-script/Code.gs para o script que vai na planilha.
 */

const WEBAPP_URL = process.env.SHEETS_WEBAPP_URL;
const TOKEN = process.env.SHEETS_TOKEN ?? "";

export function sheetsConfigured(): boolean {
  return Boolean(WEBAPP_URL);
}

interface SaveInput {
  type: PromptType;
  concept: string;
  prompt: string;
}

async function callScript<T>(payload: Record<string, unknown>): Promise<T> {
  if (!WEBAPP_URL) {
    throw new Error("SHEETS_WEBAPP_URL não configurada.");
  }
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, token: TOKEN }),
    // Apps Script responde com redirect; o fetch do Node segue por padrão.
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Apps Script respondeu ${res.status}`);
  }
  const data = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!data.ok) {
    throw new Error(data.error || "Erro desconhecido no Apps Script");
  }
  return data;
}

/** Salva um prompt no histórico. Retorna o id gerado. */
export async function saveEntry(input: SaveInput): Promise<{ id: string }> {
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await callScript({
    action: "save",
    id,
    createdAt: new Date().toISOString(),
    type: input.type,
    concept: input.concept,
    prompt: input.prompt,
  });
  return { id };
}

/** Lista o histórico (mais recentes primeiro). */
export async function listEntries(): Promise<HistoryEntry[]> {
  const data = await callScript<{ entries: HistoryEntry[] }>({ action: "list" });
  return data.entries ?? [];
}

/** Marca/desmarca um prompt como favorito. */
export async function toggleFavorite(
  id: string,
  favorite: boolean
): Promise<void> {
  await callScript({ action: "toggleFavorite", id, favorite });
}

/** Exclui um prompt do histórico (remove a linha da planilha). */
export async function deleteEntry(id: string): Promise<void> {
  await callScript({ action: "delete", id });
}

export type SkillOverrides = Partial<Record<PromptType, string>>;

/** Salva ou remove override de skill na aba "Skills". */
export async function saveSkillOverride(
  type: PromptType,
  system: string
): Promise<void> {
  await callScript({
    action: "saveSkill",
    type,
    system,
    updatedAt: new Date().toISOString(),
  });
}

/** Lista overrides de skills salvos na planilha. */
export async function listSkillOverrides(): Promise<SkillOverrides> {
  const data = await callScript<{ overrides: SkillOverrides }>({
    action: "listSkills",
  });
  return data.overrides ?? {};
}
