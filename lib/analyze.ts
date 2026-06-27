import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import { getGeminiClient } from "./gemini";
import { resolveGeminiVisionModel } from "./models";
import type { ImageAnalysis } from "./types";

const ANALYZE_SYSTEM = `Você é um analista visual especialista em DECOMPOR uma imagem em dois eixos
independentes, para uso em prompts de geração de imagem/vídeo:

1. ESTILO (a "vibe"): meio (foto, ilustração, 3D, pintura...), paleta de cores,
   iluminação, atmosfera/mood, textura/grão, tipo de lente, época/movimento
   artístico, nível de detalhe, pós-processamento. NÃO inclui QUEM ou O QUÊ
   aparece na imagem.

2. CONTEÚDO (o sujeito/cena): sujeitos, objetos, pose/ação, enquadramento,
   composição, cenário, relações espaciais. NÃO inclui a estética.

Regra crítica: mantenha os dois eixos rigorosamente separados. Um atributo de
estilo (ex.: "luz dourada de fim de tarde") nunca deve mencionar o sujeito; um
atributo de conteúdo (ex.: "uma mulher de costas") nunca deve mencionar a estética.

Devolva sempre a estrutura pedida pelo schema.

Atributos e resumo: escreva em INGLÊS (serão embutidos num prompt de geração
em inglês), salvo contexto explícito de outro idioma no pedido do usuário.`;

const ANALYZE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "Uma frase descrevendo a imagem inteira (contexto).",
    },
    styleAttributes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        "Atributos puramente ESTÉTICOS (vibe), sem mencionar o sujeito. 4 a 8 itens.",
    },
    contentAttributes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        "Sujeitos/objetos/composição, sem mencionar a estética. 3 a 6 itens.",
    },
  },
  required: ["summary", "styleAttributes", "contentAttributes"],
};

export type SupportedMedia =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

/**
 * Analisa uma imagem de referência via visão do Gemini, separando estilo e
 * conteúdo. `role` é o papel que o usuário atribuiu à imagem.
 */
export async function analyzeImage(
  base64: string,
  mediaType: SupportedMedia,
  role: "style" | "content",
  modelOverride?: string
): Promise<ImageAnalysis> {
  const guidance =
    role === "style"
      ? "O usuário marcou esta imagem como REFERÊNCIA DE ESTILO: ele quer só a vibe estética, não copiar o sujeito. Capriche nos styleAttributes."
      : "O usuário marcou esta imagem como REFERÊNCIA DE CONTEÚDO: ele quer o sujeito/composição. Capriche nos contentAttributes.";

  const modelName = resolveGeminiVisionModel(modelOverride);

  const model = getGeminiClient().getGenerativeModel({
    model: modelName,
    systemInstruction: ANALYZE_SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYZE_SCHEMA,
      maxOutputTokens: 768,
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: base64,
      },
    },
    {
      text: `${guidance}\n\nDecomponha esta imagem em estilo × conteúdo.`,
    },
  ]);

  const rawText = result.response.text();
  let parsed: Partial<ImageAnalysis>;
  try {
    parsed = JSON.parse(rawText) as Partial<ImageAnalysis>;
  } catch {
    parsed = {};
  }

  return {
    role,
    summary: parsed.summary ?? "",
    styleAttributes: parsed.styleAttributes ?? [],
    contentAttributes: parsed.contentAttributes ?? [],
  };
}
