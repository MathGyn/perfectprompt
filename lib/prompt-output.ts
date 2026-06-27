import type { GeneratedPrompt } from "./types";

/** Schema JSON compartilhado entre Claude (structured output) e Gemini. */
export const PROMPT_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description:
        "O prompt ÚNICO e final, pronto para colar no modelo-alvo. Escreva em INGLÊS, salvo pedido explícito do usuário por outro idioma. Quando fizer sentido (imagem/vídeo), os negativos (o que evitar) já vêm EMBUTIDOS aqui dentro — nunca em campo separado.",
    },
    assumptions: {
      type: "array",
      items: { type: "string" },
      description:
        "Suposições feitas para preencher lacunas do pedido do usuário.",
    },
    notes: {
      type: "string",
      description: "Dicas curtas de como usar o prompt no modelo-alvo.",
    },
  },
  required: ["prompt", "assumptions", "notes"],
  additionalProperties: false,
};

export function parseGeneratedPrompt(rawText: string): GeneratedPrompt {
  let parsed: Partial<GeneratedPrompt>;
  try {
    parsed = JSON.parse(rawText) as Partial<GeneratedPrompt>;
  } catch {
    parsed = { prompt: rawText || "(resposta vazia)" };
  }

  return {
    prompt: parsed.prompt ?? "",
    assumptions: parsed.assumptions ?? [],
    notes: parsed.notes ?? "",
  };
}
