import type { GeneratedPrompt } from "./types";

/** Schema mínimo — só o prompt final, para economizar tokens de saída. */
export const PROMPT_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description:
        "O prompt ÚNICO e final, pronto para colar no modelo-alvo. Inglês salvo pedido explícito de outro idioma. Negativos embutidos no próprio prompt quando fizer sentido.",
    },
  },
  required: ["prompt"],
  additionalProperties: false,
};

export type PromptOutputErrorCode =
  | "empty"
  | "empty_prompt"
  | "truncated"
  | "invalid_json";

export class PromptOutputError extends Error {
  readonly code: PromptOutputErrorCode;

  constructor(code: PromptOutputErrorCode, message: string) {
    super(message);
    this.name = "PromptOutputError";
    this.code = code;
  }
}

export function promptOutputErrorMessage(code: PromptOutputErrorCode): string {
  switch (code) {
    case "empty":
      return "O modelo retornou uma resposta vazia. Tente gerar novamente.";
    case "empty_prompt":
      return "O modelo não preencheu o campo do prompt. Tente gerar novamente.";
    case "truncated":
      return "O prompt foi cortado no meio (limite de tokens). Tente de novo ou use o formato “Texto corrido” em vez de JSON.";
    case "invalid_json":
      return "A resposta veio em formato inválido. Tente gerar novamente.";
  }
}

function looksLikeIncompleteJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return false;
  } catch {
    return true;
  }
}

function assertUsablePrompt(prompt: string): void {
  if (!prompt.trim()) {
    throw new PromptOutputError(
      "empty_prompt",
      promptOutputErrorMessage("empty_prompt")
    );
  }
  if (looksLikeIncompleteJson(prompt)) {
    throw new PromptOutputError(
      "truncated",
      promptOutputErrorMessage("truncated")
    );
  }
}

export function parseGeneratedPrompt(rawText: string): GeneratedPrompt {
  const trimmed = rawText?.trim() ?? "";
  if (!trimmed) {
    throw new PromptOutputError("empty", promptOutputErrorMessage("empty"));
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<GeneratedPrompt>;
    const prompt = parsed.prompt?.trim() ?? "";
    assertUsablePrompt(prompt);
    return { prompt };
  } catch (err) {
    if (err instanceof PromptOutputError) throw err;
    if (looksLikeIncompleteJson(trimmed)) {
      throw new PromptOutputError(
        "truncated",
        promptOutputErrorMessage("truncated")
      );
    }
    assertUsablePrompt(trimmed);
    return { prompt: trimmed };
  }
}
