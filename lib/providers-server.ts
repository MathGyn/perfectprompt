import { isConfigured as isAnthropicConfigured } from "./anthropic";
import { isGeminiConfigured } from "./gemini";
import { providerForType } from "./providers";
import type { PromptType } from "./skills";

export function isProviderConfigured(type: PromptType): boolean {
  return providerForType(type) === "gemini"
    ? isGeminiConfigured()
    : isAnthropicConfigured();
}
