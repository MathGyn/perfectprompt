import { NextResponse } from "next/server";
import { generatePrompt } from "@/lib/generate";
import { isProviderConfigured } from "@/lib/providers-server";
import { validateModelForType } from "@/lib/models";
import { friendlyGeminiError } from "@/lib/model-labels";
import { providerEnvKey, providerForType } from "@/lib/providers";
import { SKILLS } from "@/lib/skills";
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.type || !SKILLS[body.type]) {
    return NextResponse.json(
      { error: "Tipo de prompt inválido." },
      { status: 400 }
    );
  }
  if (!body.answers?.concept || typeof body.answers.concept !== "string") {
    return NextResponse.json(
      { error: "O campo de conceito é obrigatório." },
      { status: 400 }
    );
  }

  if (!isProviderConfigured(body.type)) {
    const provider = providerForType(body.type);
    const key = providerEnvKey(provider);
    return NextResponse.json(
      { error: `${key} não configurada no servidor.` },
      { status: 503 }
    );
  }

  if (
    body.modelOverride &&
    !validateModelForType(body.type, body.modelOverride)
  ) {
    return NextResponse.json(
      { error: "Modelo inválido para este tipo de prompt." },
      { status: 400 }
    );
  }

  try {
    const result = await generatePrompt(body);
    return NextResponse.json(result);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Erro ao gerar o prompt.";
    const msg =
      providerForType(body.type) === "gemini"
        ? friendlyGeminiError(err instanceof Error ? err : new Error(raw))
        : raw;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
