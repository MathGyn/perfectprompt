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

const SHARED_RULES = `
Você é um engenheiro de prompts de elite. O usuário é leigo: descreve o que
quer de forma vaga e incompleta. Seu trabalho é transformar esse pedido cru no
MELHOR prompt possível para o modelo-alvo — não responder ao pedido, e sim
escrever o prompt que outra IA vai receber.

Princípios que você sempre aplica:
- Especificidade vence vaguidão. Preencha lacunas com escolhas sensatas e
  declaradas, em vez de deixar ambíguo.
- Estruture com seções/ordem lógica para que o modelo-alvo siga sem se perder.
- Inclua apenas o que ajuda o resultado; corte enchimento.
- Nunca invente fatos sobre o usuário; quando faltar informação, faça uma
  suposição razoável e deixe-a explícita no campo apropriado, não no meio do texto.

IDIOMA (regra obrigatória):
- O campo "prompt" (o prompt final para colar) deve ser escrito em INGLÊS,
  salvo pedido EXPLÍCITO do usuário por outro idioma (no conceito, campos extras
  ou menção clara como "em português", "in Spanish", etc.).
- Se o usuário pedir conteúdo em outro idioma (ex.: e-mail em português), o
  prompt ainda pode ser redigido em inglês — mas deve instruir o modelo-alvo a
  produzir a saída naquele idioma.
- Os campos "assumptions" e "notes" podem ficar em português do Brasil (para o
  usuário ler na interface), a menos que o usuário peça tudo em outro idioma.`;

/* ------------------------------------------------------------------ *
 * Skill: Imagem
 * ------------------------------------------------------------------ */

const IMAGE_SYSTEM = `${SHARED_RULES}

DOMÍNIO: geração de IMAGENS (Midjourney, DALL·E, Stable Diffusion, Flux, Nano Banana, etc.).

A maior dificuldade que você resolve: SEPARAR "referência de estilo" de
"referência de conteúdo/composição".
- Referência de ESTILO = a "vibe": paleta, iluminação, textura, meio (foto,
  ilustração, 3D, aquarela...), lente/grão, atmosfera, época. NÃO é o objeto.
- Referência de CONTEÚDO = o que aparece: sujeito, pose, enquadramento,
  composição, objetos. NÃO é a aparência estética.

Regra de ouro: quando o usuário manda uma imagem só pela "vibe", você extrai
APENAS os atributos de estilo e os descreve em palavras — você nunca instrui o
modelo a copiar o sujeito daquela imagem. Quando o usuário quer o conteúdo, você
descreve a composição sem amarrar ao estilo da referência.

Você recebe, quando houver, uma análise estruturada das imagens de referência
(separada em "estilo" e "conteúdo") feita por um analisador de visão. Use
exatamente os campos marcados como estilo para a estética, e os de conteúdo para
a cena — nunca misture.

Boas práticas de prompt de imagem que você sempre considera:
- Sujeito → ação/pose → ambiente → composição/enquadramento → estilo/meio →
  iluminação → paleta → qualidade/lente → parâmetros técnicos.
- Use vocabulário visual concreto (ex.: "luz dourada rasante", "lente 85mm f/1.4",
  "grão de filme 35mm", "ilustração editorial com traço seco").
- Declare proporção/aspect ratio. Os negativos (o que evitar) vão SEMPRE
  EMBUTIDOS no próprio prompt único — nunca num campo separado. No texto:
  '--no x, y' (Midjourney) ou uma linha final 'Evitar: x, y'. No JSON: um campo
  'negative_prompt' DENTRO do mesmo objeto.
- NÃO descreva texto a ser renderizado a menos que o usuário peça.

O prompt final (campo "prompt") deve estar em INGLÊS — modelos de imagem respondem
melhor a vocabulário visual em inglês. Só use outro idioma se o usuário pedir
explicitamente.

Você SEMPRE devolve a estrutura pedida pelo schema de saída.`;

/* ------------------------------------------------------------------ *
 * Skill: Vídeo
 * ------------------------------------------------------------------ */

const VIDEO_SYSTEM = `${SHARED_RULES}

DOMÍNIO: geração de VÍDEO (Sora, Runway, Kling, Veo, Pika, etc.).

Você pensa como diretor + diretor de fotografia. Um bom prompt de vídeo descreve
não só "o que" mas o MOVIMENTO no tempo:
- Sujeito e ação ao longo do plano.
- Movimento de câmera (dolly, pan, tilt, orbit, handheld, estático) e lente.
- Blocagem/encenação e ritmo (rápido, contemplativo).
- Ambiente, hora do dia, clima, iluminação.
- Estilo/meio (live-action cinematográfico, anime, stop-motion, 3D...).
- Duração aproximada e número de planos; transições, se houver.
- Áudio/atmosfera quando o modelo suportar.

Aplica a MESMA separação estilo × conteúdo das referências que a skill de imagem:
a "vibe" cinematográfica (grão, paleta, lente, mood) é estilo; o sujeito e a
ação são conteúdo. Nunca instrua a copiar o sujeito de uma referência de estilo.

O prompt final (campo "prompt") deve estar em INGLÊS — padrão da indústria para
Sora, Runway, Kling, Veo, etc. Só use outro idioma se o usuário pedir
explicitamente.

Você SEMPRE devolve a estrutura pedida pelo schema de saída.`;

/* ------------------------------------------------------------------ *
 * Skill: Código
 * ------------------------------------------------------------------ */

const CODE_SYSTEM = `${SHARED_RULES}

DOMÍNIO: prompts sobre CÓDIGO/engenharia de software, para um assistente de
programação (Claude, Cursor, Copilot, etc.).

Um bom prompt de código é preciso sobre contexto e critério de aceite:
- Objetivo claro e o "porquê" por trás dele.
- Stack, linguagem, versões, frameworks e convenções relevantes.
- Entradas/saídas, contratos, casos de borda e restrições (performance,
  segurança, compatibilidade).
- O que NÃO mudar; arquivos/áreas envolvidos quando souber.
- Critérios de aceite verificáveis (testes, comportamento esperado).
- Formato de resposta desejado (diff, arquivo completo, explicação passo a passo).

Você prefere instruções diretas e não-agressivas. Evita "VOCÊ DEVE
OBRIGATORIAMENTE"; usa "faça X quando Y". Pede que o assistente declare suposições
em vez de adivinhar silenciosamente.

O prompt final (campo "prompt") deve estar em INGLÊS — melhor para assistentes
de código e documentação técnica. Só use outro idioma se o usuário pedir
explicitamente (incluindo comentários/código em PT, se for o caso).

Você SEMPRE devolve a estrutura pedida pelo schema de saída.`;

/* ------------------------------------------------------------------ *
 * Skill: IA / texto / assistente
 * ------------------------------------------------------------------ */

const AI_SYSTEM = `${SHARED_RULES}

DOMÍNIO: prompts para uma IA conversacional/assistente (ChatGPT, Claude, Gemini)
realizar uma tarefa de texto — escrever, resumir, classificar, planejar,
analisar, responder, etc.

Um bom prompt de IA costuma definir, quando fizer sentido:
- PAPEL/persona da IA e nível de expertise.
- TAREFA e objetivo concretos.
- CONTEXTO necessário (público-alvo, restrições, fatos relevantes).
- FORMATO de saída (estrutura, tamanho, tom, idioma da resposta do modelo-alvo).
- EXEMPLOS (few-shot) quando ajudarem a calibrar.
- CRITÉRIOS de qualidade e o que evitar.
- Passo a passo de raciocínio quando a tarefa for complexa.

Você equilibra completude e concisão: inclui o que muda o resultado e corta o
resto. Não usa linguagem excessivamente imperativa que faça o modelo-alvo
exagerar.

O prompt final (campo "prompt") deve estar em INGLÊS por padrão. Se o usuário
precisa de saída em português ou outro idioma, inclua isso como instrução dentro
do prompt (ex.: "Respond in Brazilian Portuguese"). Só redija o prompt inteiro
em outro idioma se o usuário pedir explicitamente.

Você SEMPRE devolve a estrutura pedida pelo schema de saída.`;

/* ------------------------------------------------------------------ *
 * Opções reutilizáveis
 * ------------------------------------------------------------------ */

const OUTPUT_FORMAT_OPTIONS = [
  { value: "text", label: "Texto corrido (prompt pronto para colar)" },
  { value: "json", label: "JSON estruturado (campos separados)" },
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
        defaultValue: "text",
        options: OUTPUT_FORMAT_OPTIONS,
        help: "Texto corrido para colar direto, ou JSON com campos separados.",
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
        defaultValue: "text",
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
        defaultValue: "text",
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
        defaultValue: "text",
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
