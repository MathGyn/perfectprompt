import Anthropic from "@anthropic-ai/sdk";

/** Modelo padrão. Opus 4.8 — o mais capaz para raciocínio de prompt engineering. */
export const MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

/**
 * Cliente único. A chave fica SÓ no servidor (ANTHROPIC_API_KEY), nunca chega
 * ao navegador. Lança erro claro se não estiver configurada.
 */
export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Crie um arquivo .env.local com sua chave da Anthropic."
    );
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
