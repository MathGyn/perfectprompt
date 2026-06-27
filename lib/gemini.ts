import { GoogleGenerativeAI } from "@google/generative-ai";

/** Modelo padrão para gerar prompts (imagem/vídeo). Flash ≈ 5–10× mais barato que Pro. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/** Reserva se o modelo configurado falhar. */
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";

/** Análise visual de referências — tarefa mais simples; Flash costuma bastar. */
export const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";

let client: GoogleGenerativeAI | null = null;

/**
 * Cliente Gemini. A chave fica SÓ no servidor (GEMINI_API_KEY), nunca chega
 * ao navegador.
 */
export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Crie um arquivo .env.local com sua chave do Google AI Studio."
    );
  }
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
