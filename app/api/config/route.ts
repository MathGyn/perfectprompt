import { NextResponse } from "next/server";
import { MODEL as ANTHROPIC_MODEL } from "@/lib/anthropic";
import {
  checkAnthropicConnection,
  checkGeminiConnection,
} from "@/lib/health-check";
import { GEMINI_MODEL, GEMINI_VISION_MODEL } from "@/lib/gemini";
import {
  ANTHROPIC_MODEL_OPTIONS,
  GEMINI_MODEL_OPTIONS,
  modelLabel,
} from "@/lib/models";
import { sheetsConfigured } from "@/lib/sheets";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Informa à UI o status de conexão (sem expor segredos). */
export async function GET() {
  const [anthropic, gemini] = await Promise.all([
    checkAnthropicConnection(),
    checkGeminiConnection(),
  ]);

  return NextResponse.json({
    anthropic,
    gemini,
    sheets: sheetsConfigured(),
    models: {
      gemini: GEMINI_MODEL,
      geminiVision: GEMINI_VISION_MODEL,
      anthropic: ANTHROPIC_MODEL,
      geminiLabel: modelLabel("gemini", GEMINI_MODEL),
      geminiVisionLabel: modelLabel("gemini", GEMINI_VISION_MODEL),
      anthropicLabel: modelLabel("anthropic", ANTHROPIC_MODEL),
    },
    modelOptions: {
      gemini: GEMINI_MODEL_OPTIONS,
      anthropic: ANTHROPIC_MODEL_OPTIONS,
    },
  });
}
