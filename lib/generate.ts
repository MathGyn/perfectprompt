import { getClient } from "./anthropic";
import { resolveAnthropicModel } from "./models";
import { getGeminiClient } from "./gemini";
import { resolveGeminiModel } from "./models";
import { friendlyGeminiError, isGeminiModelNotFound, isGeminiQuotaError } from "./model-labels";
import { providerForType } from "./providers";
import { SKILLS } from "./skills";
import {
  parseGeneratedPrompt,
  PromptOutputError,
  PROMPT_OUTPUT_SCHEMA,
} from "./prompt-output";
import type { GenerateRequest, GeneratedPrompt, ImageAnalysis } from "./types";
import { SchemaType, type ResponseSchema } from "@google/generative-ai";

/** Formata a análise de imagens reforçando a separação estilo × conteúdo. */
function formatImages(images: ImageAnalysis[]): string {
  if (!images.length) return "";
  const blocks = images.map((img, i) => {
    const header = `Imagem ${i + 1} — marcada pelo usuário como ${
      img.role === "style" ? "REFERÊNCIA DE ESTILO" : "REFERÊNCIA DE CONTEÚDO"
    }`;
    const usable =
      img.role === "style"
        ? `Use APENAS estes atributos de ESTILO (a vibe) — NÃO copie o sujeito:\n- ${img.styleAttributes.join(
            "\n- "
          )}`
        : `Use estes atributos de CONTEÚDO (sujeito/composição):\n- ${img.contentAttributes.join(
            "\n- "
          )}`;
    return `${header}\nResumo: ${img.summary}\n${usable}`;
  });
  return `\n\n=== IMAGENS DE REFERÊNCIA ===\n${blocks.join("\n\n")}`;
}

/** Monta o briefing legível a partir das respostas do formulário. */
function buildBriefing(req: GenerateRequest): string {
  const skill = SKILLS[req.type];
  const lines: string[] = [];

  for (const field of skill.fields) {
    if (field.name === "outputFormat") continue;
    const raw = req.answers[field.name];
    if (raw === undefined || raw === "" || raw === false) continue;
    lines.push(`${field.label}: ${typeof raw === "boolean" ? "sim" : raw}`);
  }

  const outputFormat = (req.answers.outputFormat as string) || "json";
  const formatInstruction =
    outputFormat === "json"
      ? "Formato de saída: JSON estruturado no campo prompt (objeto único com subject, style, lighting, etc.). Negativos dentro do mesmo objeto (negative_prompt/avoid). Seja conciso."
      : "Formato de saída: TEXTO CORRIDO único, pronto para colar. Negativos embutidos (--no x, y ou linha final Evitar:).";

  return `${lines.join("\n")}${formatImages(req.images ?? [])}

Formato: ${formatInstruction}
Idioma do prompt: INGLÊS, salvo pedido explícito de outro idioma acima.`;
}

const GEMINI_OUTPUT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    prompt: {
      type: SchemaType.STRING,
      description:
        "Prompt final pronto para colar. Inglês salvo pedido explícito de outro idioma.",
    },
  },
  required: ["prompt"],
};

async function generateWithAnthropic(
  req: GenerateRequest
): Promise<GeneratedPrompt> {
  const skill = SKILLS[req.type];
  const briefing = buildBriefing(req);
  const system = req.systemOverride?.trim() ? req.systemOverride : skill.system;

  const model = resolveAnthropicModel(req.modelOverride);

  const message = await getClient().messages.create({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system,
    output_config: {
      format: { type: "json_schema", schema: PROMPT_OUTPUT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `Aqui está o pedido cru do usuário (leigo). Transforme no melhor prompt possível:\n\n${briefing}`,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    throw new PromptOutputError(
      "truncated",
      "A resposta foi cortada por limite de tokens. Tente de novo ou use o formato “Texto corrido”."
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
  return parseGeneratedPrompt(rawText);
}

async function generateWithGemini(
  req: GenerateRequest
): Promise<GeneratedPrompt> {
  const skill = SKILLS[req.type];
  const briefing = buildBriefing(req);
  const system = req.systemOverride?.trim() ? req.systemOverride : skill.system;
  const primary = resolveGeminiModel(req.modelOverride);
  const models = [primary];

  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    const isLast = i === models.length - 1;
    try {
      const model = getGeminiClient().getGenerativeModel({
        model: modelName,
        systemInstruction: system,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_OUTPUT_SCHEMA,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(
        `Aqui está o pedido cru do usuário (leigo). Transforme no melhor prompt possível:\n\n${briefing}`
      );

      const response = result.response;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw new PromptOutputError(
          "truncated",
          "A resposta foi cortada por limite de tokens. Tente de novo ou use o formato “Texto corrido”."
        );
      }

      return parseGeneratedPrompt(response.text());
    } catch (err) {
      if (err instanceof PromptOutputError) throw err;
      lastError = err;
      const retryable =
        !isLast && (isGeminiQuotaError(err) || isGeminiModelNotFound(err));
      if (retryable) continue;
      throw new Error(friendlyGeminiError(err));
    }
  }

  throw new Error(friendlyGeminiError(lastError));
}

/** Gera o prompt perfeito usando o provedor adequado ao tipo. */
export async function generatePrompt(
  req: GenerateRequest
): Promise<GeneratedPrompt> {
  return providerForType(req.type) === "gemini"
    ? generateWithGemini(req)
    : generateWithAnthropic(req);
}
