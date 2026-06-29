/**
 * Skills = pré-formatação de prompt engineering por tipo de prompt.
 *
 * Cada skill tem:
 *  - metadados (id, label, etc.) usados na UI
 *  - um `system` prompt que transforma o Claude num engenheiro de prompts
 *    especialista naquele domínio
 *  - os campos de formulário que o usuário leigo preenche
 *
 * O fluxo: usuário preenche campos → montamos um "briefing" → enviamos ao
 * Claude com o `system` da skill → Claude devolve o prompt perfeito.
 */

import type { IconName } from "@/components/icons";

export type PromptType = "image" | "video" | "code" | "ai";

export type FieldType =
  | "text" // input de uma linha
  | "textarea" // texto multi-linha
  | "select" // escolha única (com opção de texto livre via "outro")
  | "toggle"; // booleano

export interface SkillField {
  /** chave usada no objeto de respostas */
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  /** para selects; o valor "" representa "deixar a IA decidir" */
  options?: { value: string; label: string }[];
  /** select permite digitar um valor próprio */
  allowCustom?: boolean;
  defaultValue?: string | boolean;
  /** campo secundário — fica recolhido em "Mais opções" */
  advanced?: boolean;
}

export interface Skill {
  id: PromptType;
  label: string;
  icon: IconName;
  tagline: string;
  /** aceita upload de imagens de referência? */
  supportsImages: boolean;
  fields: SkillField[];
  /** system prompt do engenheiro de prompts especialista */
  system: string;
}

/* ------------------------------------------------------------------ *
 * Diretrizes compartilhadas de engenharia de prompt
 * ------------------------------------------------------------------ */

const SHARED_RULES = `Engenheiro de prompts elite. Transforme o pedido leigo no melhor prompt para o modelo-alvo — escreva o prompt que outra IA receberá, não a resposta.

Regras: específico > vago; corte enchimento; lacunas → suposição razoável dentro do prompt; prompt final em INGLÊS salvo pedido explícito de outro idioma; devolva só {"prompt":"..."}.`;

const IMAGE_SYSTEM = `${SHARED_RULES}

Domínio: imagem (Midjourney, SD, Flux, DALL·E…).

Separe ESTILO (vibe: paleta, luz, textura, meio — não o objeto) de CONTEÚDO (sujeito, pose, composição). Referência de estilo → só atributos estéticos, nunca copiar sujeito. Use análises de visão nos campos corretos.

Ordem: sujeito → ação → ambiente → composição → estilo → luz → paleta → técnica. Negativos no prompt (--no ou negative_prompt). Aspect ratio explícito. Sem texto renderizado salvo pedido.`;

const VIDEO_SYSTEM = `${SHARED_RULES}

Domínio: vídeo (Sora, Runway, Kling, Veo…).

Descreva movimento no tempo: ação, câmera (dolly/pan/handheld), ritmo, ambiente, luz, estilo/meio, duração. Mesma regra estilo × conteúdo da skill de imagem. Negativos embutidos no prompt.`;

const CODE_SYSTEM = `${SHARED_RULES}

Domínio: prompt de código para assistentes (Cursor, Copilot, Claude…).

Inclua: objetivo, stack/versões, restrições, o que não mudar, critérios de aceite, formato de resposta (diff/arquivo/explicação). Tom direto, sem imperativos agressivos.`;

const AI_SYSTEM = `${SHARED_RULES}

Domínio: prompt para IA conversacional (ChatGPT, Claude, Gemini…).

Inclua quando útil: papel, tarefa, contexto, formato/tom da resposta, exemplos, critérios. Conciso — só o que muda o resultado.`;

const OUTPUT_FORMAT_OPTIONS = [
  { value: "json", label: "JSON estruturado (campos separados)" },
  { value: "text", label: "Texto corrido (prompt pronto para colar)" },
];

/* ------------------------------------------------------------------ *
 * Definição das skills
 * ------------------------------------------------------------------ */

export const SKILLS: Record<PromptType, Skill> = {
  image: {
    id: "image",
    label: "Imagem",
    icon: "image",
    tagline: "Gerar imagens — fotos, ilustrações, arte",
    supportsImages: true,
    system: IMAGE_SYSTEM,
    fields: [
      {
        name: "concept",
        label: "Conceito — o que você quer?",
        type: "textarea",
        required: true,
        placeholder:
          "Ex: uma raposa lendo um livro numa biblioteca aconchegante ao entardecer",
        help: "Descreva a cena/sujeito com suas palavras. Pode ser simples.",
      },
      {
        name: "format",
        label: "Formato / tipo de imagem",
        type: "select",
        allowCustom: true,
        defaultValue: "",
        options: [
          { value: "", label: "Deixar a IA decidir" },
          { value: "fotografia", label: "Fotografia realista" },
          { value: "ilustracao", label: "Ilustração" },
          { value: "arte_digital", label: "Arte digital / concept art" },
          { value: "render_3d", label: "Render 3D" },
          { value: "aquarela", label: "Pintura / aquarela" },
          { value: "logo", label: "Logo / ícone" },
          { value: "anime", label: "Anime / mangá" },
        ],
        help: "Pré-definido ou escreva o seu.",
      },
      {
        name: "styleReference",
        label: "Referência de ESTILO (só a vibe)",
        type: "textarea",
        placeholder:
          "Ex: estilo fotográfico cinematográfico, luz quente, grão de filme — NÃO copie o objeto",
        help: "Descreva a estética que você quer (ou marque imagens como 'estilo' abaixo). Isso NÃO será copiado como conteúdo.",
      },
      {
        name: "aspectRatio",
        label: "Proporção",
        type: "select",
        allowCustom: true,
        defaultValue: "",
        options: [
          { value: "", label: "Deixar a IA decidir" },
          { value: "1:1", label: "Quadrado 1:1" },
          { value: "16:9", label: "Paisagem 16:9" },
          { value: "9:16", label: "Retrato / stories 9:16" },
          { value: "4:5", label: "Feed 4:5" },
          { value: "3:2", label: "Foto 3:2" },
        ],
      },
      {
        name: "outputFormat",
        label: "Formato de saída do prompt",
        type: "select",
        defaultValue: "json",
        options: OUTPUT_FORMAT_OPTIONS,
        help: "JSON estruturado (padrão) ou texto corrido para colar direto.",
      },
      {
        name: "extra",
        label: "Detalhes extras (opcional)",
        type: "textarea",
        placeholder:
          "Cores que quer/não quer, clima, elementos obrigatórios, plataforma de destino...",
      },
    ],
  },

  video: {
    id: "video",
    label: "Vídeo",
    icon: "video",
    tagline: "Gerar vídeos — clipes, cenas, animações",
    supportsImages: true,
    system: VIDEO_SYSTEM,
    fields: [
      {
        name: "concept",
        label: "Conceito — o que deve acontecer?",
        type: "textarea",
        required: true,
        placeholder:
          "Ex: um astronauta caminha em câmera lenta por uma praia de areia vermelha enquanto duas luas nascem",
        help: "Descreva a ação/cena. Pense no que se move.",
      },
      {
        name: "format",
        label: "Estilo / meio",
        type: "select",
        allowCustom: true,
        defaultValue: "",
        options: [
          { value: "", label: "Deixar a IA decidir" },
          { value: "cinematografico", label: "Live-action cinematográfico" },
          { value: "documental", label: "Documental / realista" },
          { value: "anime", label: "Anime" },
          { value: "3d", label: "Animação 3D" },
          { value: "stopmotion", label: "Stop-motion" },
          { value: "publicidade", label: "Comercial / publicidade" },
        ],
      },
      {
        name: "camera",
        label: "Câmera & movimento (opcional)",
        type: "text",
        placeholder: "Ex: dolly lento aproximando, lente 35mm, handheld",
      },
      {
        name: "duration",
        label: "Duração aproximada",
        type: "select",
        allowCustom: true,
        defaultValue: "",
        options: [
          { value: "", label: "Deixar a IA decidir" },
          { value: "4s", label: "~4 segundos" },
          { value: "8s", label: "~8 segundos" },
          { value: "15s", label: "~15 segundos" },
          { value: "30s", label: "~30 segundos" },
        ],
      },
      {
        name: "styleReference",
        label: "Referência de ESTILO (só a vibe)",
        type: "textarea",
        placeholder:
          "Ex: paleta fria, grão de filme, mood melancólico — sem copiar o sujeito",
        help: "A estética cinematográfica que você quer; não será copiada como conteúdo.",
      },
      {
        name: "outputFormat",
        label: "Formato de saída do prompt",
        type: "select",
        defaultValue: "json",
        options: OUTPUT_FORMAT_OPTIONS,
      },
      {
        name: "extra",
        label: "Detalhes extras (opcional)",
        type: "textarea",
        placeholder: "Áudio, clima, hora do dia, elementos obrigatórios...",
      },
    ],
  },

  code: {
    id: "code",
    label: "Código",
    icon: "code",
    tagline: "Prompts sobre programação e software",
    supportsImages: false,
    system: CODE_SYSTEM,
    fields: [
      {
        name: "concept",
        label: "O que você quer construir/resolver?",
        type: "textarea",
        required: true,
        placeholder:
          "Ex: uma função que recebe um CSV de vendas e devolve o total por mês",
      },
      {
        name: "stack",
        label: "Linguagem / stack",
        type: "text",
        placeholder: "Ex: Python 3.12, ou React + TypeScript, ou 'não sei'",
        help: "Se não souber, deixe em branco que a IA sugere.",
      },
      {
        name: "context",
        label: "Contexto / restrições (opcional)",
        type: "textarea",
        placeholder:
          "Onde isso roda, o que não pode mudar, performance, compatibilidade...",
      },
      {
        name: "acceptance",
        label: "Como saber que ficou pronto? (opcional)",
        type: "textarea",
        placeholder: "Comportamento esperado, casos de teste, exemplos de entrada/saída",
      },
      {
        name: "responseFormat",
        label: "Formato de resposta desejado",
        type: "select",
        allowCustom: true,
        defaultValue: "",
        options: [
          { value: "", label: "Deixar a IA decidir" },
          { value: "arquivo_completo", label: "Arquivo(s) completo(s)" },
          { value: "diff", label: "Diff / patch" },
          { value: "explicado", label: "Passo a passo explicado" },
        ],
      },
      {
        name: "outputFormat",
        label: "Formato de saída do prompt",
        type: "select",
        defaultValue: "json",
        options: OUTPUT_FORMAT_OPTIONS,
      },
    ],
  },

  ai: {
    id: "ai",
    label: "IA / Texto",
    icon: "ai",
    tagline: "Prompts para ChatGPT, Claude, Gemini",
    supportsImages: false,
    system: AI_SYSTEM,
    fields: [
      {
        name: "concept",
        label: "O que você quer que a IA faça?",
        type: "textarea",
        required: true,
        placeholder:
          "Ex: escrever um e-mail de cobrança educado para um cliente atrasado",
      },
      {
        name: "role",
        label: "Papel da IA (opcional)",
        type: "text",
        placeholder: "Ex: copywriter sênior, advogado, professor de física",
      },
      {
        name: "audience",
        label: "Público / contexto (opcional)",
        type: "textarea",
        placeholder: "Para quem é, tom desejado, fatos que a IA precisa saber",
      },
      {
        name: "format",
        label: "Formato da resposta da IA (opcional)",
        type: "text",
        placeholder: "Ex: lista com 5 itens, máximo 200 palavras, tabela...",
      },
      {
        name: "outputFormat",
        label: "Formato de saída do prompt",
        type: "select",
        defaultValue: "json",
        options: OUTPUT_FORMAT_OPTIONS,
      },
      {
        name: "extra",
        label: "Detalhes extras (opcional)",
        type: "textarea",
        placeholder: "Exemplos, restrições, o que evitar...",
      },
    ],
  },
};

export const SKILL_LIST: Skill[] = [
  SKILLS.image,
  SKILLS.video,
  SKILLS.code,
  SKILLS.ai,
];
