/**
 * Conjunto de ícones SVG da aplicação — traço consistente (1.6, cantos
 * arredondados, currentColor). Zero emojis. Estilo "linha" coeso.
 */
import type { SVGProps } from "react";

type IconName =
  | "image"
  | "video"
  | "code"
  | "ai"
  | "copy"
  | "check"
  | "star"
  | "star-filled"
  | "refresh"
  | "plus"
  | "arrow-right"
  | "history"
  | "close"
  | "chevron-down"
  | "info"
  | "image-plus"
  | "sliders"
  | "settings"
  | "arrow-left"
  | "trash"
  | "sparkle";

const PATHS: Record<IconName, React.ReactNode> = {
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L20 21" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M10 12.2v3.6l3.2-1.8z" fill="currentColor" stroke="none" />
    </>
  ),
  code: (
    <>
      <path d="M8.5 8L4.5 12l4 4" />
      <path d="M15.5 8l4 4-4 4" />
      <path d="M13.2 6l-2.4 12" />
    </>
  ),
  ai: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5z" />
      <path d="M12 6.4l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h7a2 2 0 0 1 2 2" />
    </>
  ),
  check: <path d="M5 12.5l4 4 10-10" />,
  star: (
    <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
  ),
  "star-filled": (
    <path
      d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"
      fill="currentColor"
      stroke="none"
    />
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.5M4 5v3.5h3.5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.5M20 19v-3.5h-3.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 9a9 9 0 1 1-.6 5" />
      <path d="M3 5v4h4" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  "image-plus": (
    <>
      <path d="M21 13.5V6a2.5 2.5 0 0 0-2.5-2.5H5.5A2.5 2.5 0 0 0 3 6v11a2.5 2.5 0 0 0 2.5 2.5H13" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M4 16l4-4a2 2 0 0 1 2.7 0l3 3" />
      <path d="M17.5 16v6M14.5 19h6" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z" />
  ),
  sliders: (
    <>
      <path d="M4 8h8" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M18.5 8H20" />
      <path d="M4 16h2" />
      <circle cx="9" cy="16" r="2.2" />
      <path d="M11.5 16H20" />
    </>
  ),
  settings: (
    <>
      <path d="M9.6 3.94c.09-.542.56-.94 1.11-.94h2.59c.55 0 1.02.398 1.11.94l.21 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <circle cx="12" cy="12" r="2.25" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6 7l.8 11a2 2 0 0 0 2 1.9h6.4a2 2 0 0 0 2-1.9L18 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Marca da aplicação — prisma de refração (entrada → prompt refinado). */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.2 21 19H3z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <path
        d="M2 11h6"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M14 13l8-2M14 16l7 1"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export type { IconName };
