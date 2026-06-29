import { NextResponse } from "next/server";
import {
  listSkillOverrides,
  saveSkillOverride,
  sheetsConfigured,
} from "@/lib/sheets";
import { SKILLS, type PromptType } from "@/lib/skills";

export const runtime = "nodejs";

/** GET — lista overrides de skills salvos na planilha. */
export async function GET() {
  if (!sheetsConfigured()) {
    return NextResponse.json({ overrides: {}, configured: false });
  }
  try {
    const overrides = await listSkillOverrides();
    return NextResponse.json({ overrides, configured: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Erro ao ler skills da planilha.";
    return NextResponse.json({ error: msg, configured: true }, { status: 500 });
  }
}

/** POST — salva ou remove override de skill na aba "Skills". */
export async function POST(req: Request) {
  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Planilha não configurada (SHEETS_WEBAPP_URL)." },
      { status: 503 }
    );
  }
  let body: { type: PromptType; system: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.type || !SKILLS[body.type]) {
    return NextResponse.json({ error: "Tipo de skill inválido." }, { status: 400 });
  }
  try {
    await saveSkillOverride(body.type, body.system ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar skill.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
