import { getClient } from "./anthropic";
import { isConfigured as isAnthropicConfigured } from "./anthropic";
import { GEMINI_VISION_MODEL } from "./gemini";
import { isGeminiConfigured } from "./gemini";

const TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

/** Ping leve na API da Anthropic (sem gastar tokens de geração). */
export async function checkAnthropicConnection(): Promise<boolean> {
  if (!isAnthropicConfigured()) return false;
  try {
    await withTimeout(getClient().models.list({ limit: 1 }), TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
}

/** Ping leve na API do Gemini (consulta metadados do modelo). */
export async function checkGeminiConnection(): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isGeminiConfigured() || !apiKey) return false;
  try {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}`
    );
    url.searchParams.set("key", apiKey);
    const res = await withTimeout(fetch(url, { method: "GET" }), TIMEOUT_MS);
    return res.ok;
  } catch {
    return false;
  }
}
