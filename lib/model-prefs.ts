import {
  ANTHROPIC_MODEL_OPTIONS,
  GEMINI_MODEL_OPTIONS,
  modelLabel,
  type ModelOption,
} from "./models";
import type { LlmProvider } from "./providers";

const KEY = "pp_model_prefs";

export type ModelPrefs = {
  gemini?: string;
  anthropic?: string;
};

export function loadModelPrefs(): ModelPrefs {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as ModelPrefs;
  } catch {
    return {};
  }
}

export function saveModelPref(
  provider: LlmProvider,
  modelId: string | null
): ModelPrefs {
  if (typeof window === "undefined") return {};
  const prefs = loadModelPrefs();
  const allowed = optionsForProvider(provider).some((m) => m.id === modelId);
  if (modelId && allowed) {
    prefs[provider] = modelId;
  } else {
    delete prefs[provider];
  }
  localStorage.setItem(KEY, JSON.stringify(prefs));
  return prefs;
}

export function optionsForProvider(provider: LlmProvider): ModelOption[] {
  return provider === "gemini" ? GEMINI_MODEL_OPTIONS : ANTHROPIC_MODEL_OPTIONS;
}

export function selectedModel(
  provider: LlmProvider,
  prefs: ModelPrefs,
  serverDefault: string
): string {
  const pick = prefs[provider];
  const allowed = optionsForProvider(provider).some((m) => m.id === pick);
  return pick && allowed ? pick : serverDefault;
}

export function selectedModelLabel(
  provider: LlmProvider,
  prefs: ModelPrefs,
  serverDefault: string
): string {
  return modelLabel(provider, selectedModel(provider, prefs, serverDefault));
}
