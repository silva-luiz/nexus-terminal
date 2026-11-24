import { z } from "zod";
import { HEX_COLOR, isDark, mix } from "./color";
import { slugify } from "../settings/profiles";

/** Formato de tema (docs/05-configuracoes.md §5.3). */

export const ANSI_KEYS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;

export const UI_KEYS = [
  "background",
  "surface",
  "surfaceHover",
  "border",
  "text",
  "textMuted",
  "accent",
  "tabActive",
  "tabInactive",
] as const;

type AnsiKey = (typeof ANSI_KEYS)[number];
type UiKey = (typeof UI_KEYS)[number];

export type TerminalColors = Record<AnsiKey | "background" | "foreground", string> & {
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
};

export type UiColors = Record<UiKey, string>;

export interface Theme {
  id: string;
  name: string;
  type: "dark" | "light";
  ui: UiColors;
  terminal: TerminalColors;
  source: "builtin" | "user";
}

const hex = z.string().regex(HEX_COLOR);

const terminalSchema = z.object({
  background: hex,
  foreground: hex,
  cursor: hex.optional(),
  cursorAccent: hex.optional(),
  selectionBackground: hex.optional(),
  ...Object.fromEntries(ANSI_KEYS.map((k) => [k, hex])),
});

const uiPartialSchema = z.object(
  Object.fromEntries(UI_KEYS.map((k) => [k, hex.optional().catch(undefined)])),
);

/** Cores da interface derivadas do terminal; `override` substitui as que vierem definidas. */
export function deriveUi(
  terminal: TerminalColors,
  type: Theme["type"],
  override: Partial<UiColors> = {},
): UiColors {
  const bg = terminal.background;
  const fg = terminal.foreground;
  const derived: UiColors = {
    tabActive: bg,
    tabInactive: mix(bg, "#000000", type === "dark" ? 0.22 : 0.05),
    background: mix(bg, "#000000", type === "dark" ? 0.22 : 0.05),
    surface: mix(bg, fg, type === "dark" ? 0.06 : 0.02),
    surfaceHover: mix(bg, fg, 0.11),
    border: mix(bg, fg, 0.17),
    text: fg,
    textMuted: mix(bg, fg, 0.62),
    accent: terminal.blue,
  };
  const defined = Object.fromEntries(
    Object.entries(override).filter(([, v]) => typeof v === "string"),
  );
  return { ...derived, ...defined };
}

function completeTerminal(parsed: z.infer<typeof terminalSchema>): TerminalColors {
  const colors = parsed as Record<string, string | undefined>;
  return {
    ...(colors as Record<AnsiKey | "background" | "foreground", string>),
    cursor: colors.cursor ?? colors.foreground!,
    cursorAccent: colors.cursorAccent ?? colors.background!,
    selectionBackground: colors.selectionBackground ?? mix(colors.background!, colors.blue!, 0.35),
  };
}

/** Converte um esquema do Windows Terminal (usa "purple" em vez de "magenta"). */
function fromWindowsTerminal(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    ...raw,
    magenta: raw.magenta ?? raw.purple,
    brightMagenta: raw.brightMagenta ?? raw.brightPurple,
    cursor: raw.cursor ?? raw.cursorColor,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Aceita um tema do Nexus (`{ id, name, type, ui, terminal }`) ou um esquema de cores do
 * Windows Terminal. Retorna null se não for um tema válido.
 */
export function normalizeTheme(raw: unknown, source: Theme["source"] = "user"): Theme | null {
  if (!isObject(raw)) return null;
  const terminalRaw = isObject(raw.terminal) ? raw.terminal : fromWindowsTerminal(raw);
  const parsed = terminalSchema.safeParse(terminalRaw);
  if (!parsed.success) return null;
  const terminal = completeTerminal(parsed.data);

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Tema";
  const rawId = typeof raw.id === "string" ? raw.id : "";
  const id = /^[a-z0-9-]{1,64}$/.test(rawId) ? rawId : slugify(name).slice(0, 64) || "tema";
  const type =
    raw.type === "dark" || raw.type === "light"
      ? raw.type
      : isDark(terminal.background)
        ? "dark"
        : "light";
  const uiOverride = uiPartialSchema.safeParse(raw.ui ?? {});
  const ui = deriveUi(terminal, type, uiOverride.success ? uiOverride.data : {});
  return { id, name, type, ui, terminal, source };
}

/** Um arquivo pode ter um tema ou vários (ex.: `{ "schemes": [...] }` do Windows Terminal). */
export function importThemes(raw: unknown): Theme[] {
  const list = isObject(raw) && Array.isArray(raw.schemes) ? raw.schemes : [raw];
  return list.map((item) => normalizeTheme(item, "user")).filter((t): t is Theme => t !== null);
}

/** Formato gravado em disco (sem o campo `source`, que é só do app). */
export function themeToJson(theme: Theme): Omit<Theme, "source"> {
  const { source: _source, ...rest } = theme;
  void _source;
  return rest;
}
