# ✦ PerfectPrompt

Aplicação web que transforma um pedido simples e leigo no **melhor prompt
possível**, aplicando prompt engineering com o Claude (Anthropic). Quatro tipos
de prompt, cada um com uma "skill" (pré-formatação especializada):

| Tipo | O que faz |
|------|-----------|
| 🖼️ **Imagem** | Prompts para Midjourney, DALL·E, Flux, etc. — com separação estilo × conteúdo |
| 🎬 **Vídeo** | Prompts para Sora, Runway, Kling, Veo — pensando como diretor/DP |
| 💻 **Código** | Prompts precisos para assistentes de programação |
| 🤖 **IA / Texto** | Prompts para ChatGPT, Claude, Gemini realizarem tarefas de texto |

## A ideia

O usuário leigo descreve o que quer (campo de **conceito** + alguns campos
opcionais). A app monta um briefing e envia ao Claude com o **system prompt da
skill** correspondente — um engenheiro de prompts especialista naquele domínio.
O Claude devolve, com saída estruturada garantida, o **prompt pronto** para colar
(JSON estruturado por padrão, ou texto corrido se preferir). Negativos (imagem/vídeo)
vêm embutidos no próprio prompt.

### O ponto difícil: estilo × conteúdo

Quando o usuário manda uma imagem só pela "vibe", a IA tende a copiar o sujeito.
Aqui, o usuário **marca cada imagem** como _estilo_ ou _conteúdo_, e o Claude
(visão) decompõe a imagem em dois eixos independentes — extraindo **só** os
atributos estéticos (estilo) ou **só** o sujeito/composição (conteúdo). O
gerador então usa exatamente o eixo certo, sem misturar.

## Setup

### 1. Chave da Anthropic (obrigatório)

```bash
cp .env.local.example .env.local
```

Edite `.env.local` e preencha `ANTHROPIC_API_KEY=sk-ant-...`. A chave fica **só
no servidor** — nunca chega ao navegador.

### 2. Rodar

```bash
npm install   # já feito
npm run dev
```

Abra http://localhost:3000.

### 3. Histórico no Google Sheets (opcional)

A planilha continua sendo uma planilha normal; a app só "escreve" nela via um
pequeno Web App do Apps Script. Sem isso, a app funciona — só não persiste o
histórico.

1. Crie uma planilha nova no Google Sheets.
2. **Extensões → Apps Script**, apague tudo e cole o conteúdo de
   [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. (Opcional) troque a constante `TOKEN` por uma senha sua.
4. **Implantar → Nova implantação → App da Web**
   - Executar como: **Eu mesmo**
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a **URL do app da web** e cole em `SHEETS_WEBAPP_URL` no `.env.local`.
   Se usou senha, repita-a em `SHEETS_TOKEN`.
6. Reinicie o `npm run dev`.

A app cria automaticamente as abas **Prompts**, **Favoritos** e **Skills**.
Favoritar na app reflete na aba; você também pode editar tudo à mão. Os
comandos personalizados das skills (Configurações) vão para a aba **Skills**.

## Arquitetura

```
app/
  page.tsx                 UI principal (tabs, form, resultado, histórico)
  api/
    generate/route.ts      gera o prompt (Claude + skill + saída estruturada)
    analyze-image/route.ts visão: separa estilo × conteúdo de uma imagem
    history/route.ts       GET lista / POST salva / PATCH favorita (Sheets)
    skills/route.ts        GET/POST overrides de skills (aba Skills)
    config/route.ts        diz à UI o que está configurado
lib/
  skills.ts                as 4 skills: system prompts + campos de formulário
  generate.ts              monta o briefing e chama o Claude
  analyze.ts               análise de imagem por visão
  anthropic.ts             cliente (chave só no servidor)
  sheets.ts                ponte com o Apps Script
  types.ts                 tipos compartilhados
components/                ImageUploader, PromptForm, ResultPanel, HistoryPanel
google-apps-script/Code.gs script para colar na planilha
```

- **Modelo:** `claude-opus-4-8` com adaptive thinking.
- **Saída estruturada:** `output_config.format` (json_schema) garante respostas
  parseáveis.
- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4.

## Deploy

Funciona direto na Vercel. Configure as variáveis de ambiente
(`ANTHROPIC_API_KEY`, e opcionalmente `SHEETS_WEBAPP_URL` / `SHEETS_TOKEN`) no
painel do projeto.
