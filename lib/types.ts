import type { PromptType } from "./skills";

/** Análise de uma imagem de referência, separada em estilo × conteúdo. */
export interface ImageAnalysis {
  /** papel que o usuário atribuiu à imagem */
  role: "style" | "content";
  /** descrição enxuta da imagem inteira (para contexto) */
  summary: string;
  /** atributos puramente estéticos (vibe) — usados quando role=style */
  styleAttributes: string[];
  /** sujeitos/objetos/composição — usados quando role=content */
  contentAttributes: string[];
}

/** Respostas do formulário (dependem da skill). */
export type Answers = Record<string, string | boolean>;

/** Resultado final que o gerador devolve — apenas o prompt pronto para colar. */
export interface GeneratedPrompt {
  prompt: string;
}

/** Entrada da rota /api/generate. */
export interface GenerateRequest {
  type: PromptType;
  answers: Answers;
  /** análises das imagens de referência, se houver */
  images?: ImageAnalysis[];
  /**
   * Override do system prompt da skill (definido na página de Configurações).
   * Quando vazio/ausente, usa o padrão de lib/skills.ts.
   */
  systemOverride?: string;
  /** Modelo escolhido na UI (Gemini ou Claude, conforme o tipo). */
  modelOverride?: string;
}

/** Registro salvo no histórico (Google Sheets). */
export interface HistoryEntry {
  id: string;
  createdAt: string; // ISO
  type: PromptType;
  concept: string;
  prompt: string;
  favorite: boolean;
}
