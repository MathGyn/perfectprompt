import { MODEL as ANTHROPIC_DEFAULT } from "./anthropic";
import { GEMINI_MODEL as GEMINI_DEFAULT, GEMINI_VISION_MODEL as GEMINI_VISION_DEFAULT } from "./gemini";
import type { LlmProvider } from "./providers";
import { providerForType } from "./providers";
import type { PromptType } from "./skills";

export interface ModelOption {
  id: string;
  label: string;
  hint: string;
}

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-2.5-flash", label: "2.5 Flash", hint: "Recomendado · econômico" },
  { id: "gemini-2.5-pro", label: "2.5 Pro", hint: "Máxima qualidade · mais caro" },
];

export const ANTHROPIC_MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-opus-4-8", label: "Opus 4.8", hint: "Melhor qualidade" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", hint: "Equilibrado" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "Mais rápido" },
];

const GEMINI_IDS = new Set(GEMINI_MODEL_OPTIONS.map((m) => m.id));
const ANTHROPIC_IDS = new Set(ANTHROPIC_MODEL_OPTIONS.map((m) => m.id));

export function isAllowedGeminiModel(id: string): boolean {
  return GEMINI_IDS.has(id);
}

export function isAllowedAnthropicModel(id: string): boolean {
  return ANTHROPIC_IDS.has(id);
}

export function modelOptionsForProvider(provider: LlmProvider): ModelOption[] {
  return provider === "gemini" ? GEMINI_MODEL_OPTIONS : ANTHROPIC_MODEL_OPTIONS;
}

export function modelLabel(provider: LlmProvider, modelId: string): string {
  const opt = modelOptionsForProvider(provider).find((m) => m.id === modelId);
  if (opt) return opt.label;
  return modelId.replace(/^gemini-|^claude-/, "");
}

/** Resolve modelo Gemini no servidor (override → env → padrão). */
export function resolveGeminiModel(override?: string): string {
  if (override && isAllowedGeminiModel(override)) return override;
  return GEMINI_DEFAULT;
}

/** Modelo só para análise de imagens — independente do modelo de geração. */
export function resolveGeminiVisionModel(override?: string): string {
  if (override && isAllowedGeminiModel(override)) return override;
  return GEMINI_VISION_DEFAULT;
}

/** Resolve modelo Claude no servidor (override → env → padrão). */
export function resolveAnthropicModel(override?: string): string {
  if (override && isAllowedAnthropicModel(override)) return override;
  return process.env.ANTHROPIC_MODEL ?? ANTHROPIC_DEFAULT;
}

export function validateModelForType(
  type: PromptType,
  modelId: string
): boolean {
  return providerForType(type) === "gemini"
    ? isAllowedGeminiModel(modelId)
    : isAllowedAnthropicModel(modelId);
}
