import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display de personalidade — usado com restrição no wordmark e títulos.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PerfectPrompt — engenharia de prompts assistida",
  description:
    "Transforme um pedido simples no melhor prompt possível para imagem, vídeo, código e IA — com prompt engineering aplicado pelo Claude.",
  keywords: [
    "prompt",
    "prompt engineering",
    "IA",
    "Claude",
    "geração de imagem",
    "geração de vídeo",
  ],
  openGraph: {
    title: "PerfectPrompt",
    description:
      "Você descreve do seu jeito. O Claude refina no prompt perfeito — imagem, vídeo, código e IA.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#f2f1ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
