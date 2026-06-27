import { NextResponse } from "next/server";
import {
  listEntries,
  saveEntry,
  toggleFavorite,
  deleteEntry,
  sheetsConfigured,
} from "@/lib/sheets";
import { SKILLS, type PromptType } from "@/lib/skills";

export const runtime = "nodejs";

/** GET — lista o histórico salvo na planilha. */
export async function GET() {
  if (!sheetsConfigured()) {
    return NextResponse.json({ entries: [], configured: false });
  }
  try {
    const entries = await listEntries();
    return NextResponse.json({ entries, configured: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao ler o histórico.";
    return NextResponse.json({ error: msg, configured: true }, { status: 500 });
  }
}

/** POST — salva um prompt no histórico. */
export async function POST(req: Request) {
  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Planilha não configurada (SHEETS_WEBAPP_URL)." },
      { status: 503 }
    );
  }
  let body: { type: PromptType; concept: string; prompt: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.type || !SKILLS[body.type] || !body.prompt) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  try {
    const { id } = await saveEntry({
      type: body.type,
      concept: body.concept ?? "",
      prompt: body.prompt,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH — marca/desmarca favorito. */
export async function PATCH(req: Request) {
  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Planilha não configurada." },
      { status: 503 }
    );
  }
  let body: { id: string; favorite: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id ausente." }, { status: 400 });
  }
  try {
    await toggleFavorite(body.id, Boolean(body.favorite));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — exclui um prompt do histórico. */
export async function DELETE(req: Request) {
  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Planilha não configurada." },
      { status: 503 }
    );
  }
  let body: { id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id ausente." }, { status: 400 });
  }
  try {
    await deleteEntry(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao excluir.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
