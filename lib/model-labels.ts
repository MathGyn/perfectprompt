/** Mensagens amigáveis para erros da API Gemini. */
export function friendlyGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes("429") ||
    /quota exceeded/i.test(msg) ||
    /free_tier/i.test(msg)
  ) {
    if (/limit:\s*0/i.test(msg)) {
      return (
        "Seu projeto Gemini está com cota zero. No Google AI Studio, abra seu projeto → " +
        "“Set up billing” / “Configurar faturamento”, vincule uma conta de billing do Google Cloud " +
        "(mín. ~US$ 10 de crédito no plano pago) e crie uma **nova** API key depois disso. " +
        "Substitua GEMINI_API_KEY no .env.local e reinicie o servidor. " +
        "Guia: ai.google.dev/gemini-api/docs/billing"
      );
    }
    return (
      "Cota do Gemini esgotada (rate limit). Aguarde ~1 minuto e tente de novo, " +
      "ou verifique billing e limites em ai.dev/rate-limit."
    );
  }

  if (msg.includes("404") || /not found/i.test(msg) || /no longer/i.test(msg)) {
    return (
      "Modelo Gemini indisponível ou descontinuado. Use GEMINI_MODEL=gemini-2.5-pro " +
      "no .env.local e reinicie o servidor."
    );
  }

  if (msg.includes("403") || /permission/i.test(msg)) {
    return "Chave Gemini inválida ou sem permissão. Verifique GEMINI_API_KEY no .env.local.";
  }

  return msg.length > 280 ? "Erro ao chamar a API do Gemini. Tente novamente." : msg;
}

export function isGeminiModelNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("404") || /not found/i.test(msg) || /no longer/i.test(msg);
}

export function isGeminiQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    /quota exceeded/i.test(msg) ||
    /free_tier/i.test(msg)
  );
}

/** Rótulo legível para exibir na UI (ex.: gemini-2.0-flash → 2.0 Flash). */
export function formatGeminiModelLabel(modelId: string): string {
  const slug = modelId.replace(/^gemini-/, "");
  const parts = slug.split("-").map((part) => {
    if (/^\d/.test(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  return parts.join(" ");
}

export function formatAnthropicModelLabel(modelId: string): string {
  if (modelId.includes("opus")) return "Opus 4.8";
  if (modelId.includes("sonnet")) return "Sonnet";
  if (modelId.includes("haiku")) return "Haiku";
  return modelId;
}
