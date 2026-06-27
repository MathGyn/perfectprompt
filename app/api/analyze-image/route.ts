import { NextResponse } from "next/server";
import { analyzeImage, type SupportedMedia } from "@/lib/analyze";
import { isGeminiConfigured } from "@/lib/gemini";
import { friendlyGeminiError } from "@/lib/model-labels";
import { isAllowedGeminiModel } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 120;

const SUPPORTED: SupportedMedia[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

interface Body {
  base64: string;
  mediaType: SupportedMedia;
  role: "style" | "content";
  modelOverride?: string;
}

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no servidor." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.base64) {
    return NextResponse.json({ error: "Imagem ausente." }, { status: 400 });
  }
  if (!SUPPORTED.includes(body.mediaType)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPG, PNG, GIF ou WebP." },
      { status: 400 }
    );
  }
  const role = body.role === "content" ? "content" : "style";

  if (body.modelOverride && !isAllowedGeminiModel(body.modelOverride)) {
    return NextResponse.json({ error: "Modelo Gemini inválido." }, { status: 400 });
  }

  try {
    const analysis = await analyzeImage(
      body.base64,
      body.mediaType,
      role,
      body.modelOverride
    );
    return NextResponse.json(analysis);
  } catch (err) {
    const msg = friendlyGeminiError(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
