import type { PromptType } from "./skills";

export type LlmProvider = "anthropic" | "gemini";

/** Imagem e vídeo → Gemini; código e IA → Claude. */
export function providerForType(type: PromptType): LlmProvider {
  return type === "image" || type === "video" ? "gemini" : "anthropic";
}

export function providerEnvKey(provider: LlmProvider): string {
  return provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY";
}

export function providerDisplayName(provider: LlmProvider): string {
  return provider === "gemini" ? "Gemini" : "Claude";
}

export function providerModelLabel(
  type: PromptType,
  models?: { geminiLabel: string; anthropicLabel: string }
): string {
  if (models) {
    return providerForType(type) === "gemini"
      ? models.geminiLabel
      : models.anthropicLabel;
  }
  return providerForType(type) === "gemini" ? "2.5 Pro" : "Opus 4.8";
}

export function isTypeConfigured(
  type: PromptType,
  config: { anthropic: boolean; gemini: boolean }
): boolean {
  return providerForType(type) === "gemini" ? config.gemini : config.anthropic;
}
