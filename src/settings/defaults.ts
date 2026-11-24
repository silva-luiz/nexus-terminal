import { z } from "zod";
import type {
  AppearanceSettings,
  TerminalSettings,
  KeybindingOverride,
  LanguageSetting,
  Settings,
  ThemeSettings,
} from "../lib/types";

/**
 * Lê as seções opcionais do settings.json com valores padrão. Um campo inválido
 * (editado à mão, por exemplo) cai no padrão sem afetar os outros.
 */

export const DEFAULT_THEME: ThemeSettings = {
  mode: "system",
  dark: "nexus-dark",
  light: "nexus-light",
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontFamily: "Cascadia Code",
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: "bar",
  cursorBlink: true,
};

export const FONT_SIZE = { min: 8, max: 32 } as const;
export const LINE_HEIGHT = { min: 1, max: 2 } as const;
export const SCROLLBACK = { min: 1_000, max: 100_000 } as const;

export interface ClipboardSettings {
  copyOnSelect: boolean;
  rightClickPaste: boolean;
  ctrlCCopiesSelection: boolean;
  confirmMultilinePaste: boolean;
}

export const DEFAULT_CLIPBOARD: ClipboardSettings = {
  copyOnSelect: false,
  rightClickPaste: true,
  ctrlCCopiesSelection: true,
  confirmMultilinePaste: true,
};

export const DEFAULT_TERMINAL: TerminalSettings = {
  scrollback: 10_000,
  renderer: "webgl",
  screenReaderMode: false,
};

const clipboardSchema = z.object({
  copyOnSelect: z.boolean().catch(DEFAULT_CLIPBOARD.copyOnSelect),
  rightClickPaste: z.boolean().catch(DEFAULT_CLIPBOARD.rightClickPaste),
  ctrlCCopiesSelection: z.boolean().catch(DEFAULT_CLIPBOARD.ctrlCCopiesSelection),
  confirmMultilinePaste: z.boolean().catch(DEFAULT_CLIPBOARD.confirmMultilinePaste),
});

const terminalSchema = z.object({
  scrollback: z
    .number()
    .int()
    .min(SCROLLBACK.min)
    .max(SCROLLBACK.max)
    .catch(DEFAULT_TERMINAL.scrollback),
  renderer: z.enum(["webgl", "dom"]).catch(DEFAULT_TERMINAL.renderer),
  screenReaderMode: z.boolean().catch(DEFAULT_TERMINAL.screenReaderMode),
});

/** Opções de copiar/colar (ficam em `general` no settings.json). */
export function readClipboard(settings: Settings | null): ClipboardSettings {
  return clipboardSchema.parse(settings?.general ?? {});
}

export function readTerminal(settings: Settings | null): TerminalSettings {
  return terminalSchema.parse(settings?.terminal ?? {});
}

const themeSchema = z.object({
  mode: z.enum(["system", "dark", "light"]).catch(DEFAULT_THEME.mode),
  dark: z.string().min(1).catch(DEFAULT_THEME.dark),
  light: z.string().min(1).catch(DEFAULT_THEME.light),
});

const appearanceSchema = z.object({
  fontFamily: z.string().trim().min(1).catch(DEFAULT_APPEARANCE.fontFamily),
  fontSize: z.number().min(FONT_SIZE.min).max(FONT_SIZE.max).catch(DEFAULT_APPEARANCE.fontSize),
  lineHeight: z
    .number()
    .min(LINE_HEIGHT.min)
    .max(LINE_HEIGHT.max)
    .catch(DEFAULT_APPEARANCE.lineHeight),
  cursorStyle: z.enum(["bar", "block", "underline"]).catch(DEFAULT_APPEARANCE.cursorStyle),
  cursorBlink: z.boolean().catch(DEFAULT_APPEARANCE.cursorBlink),
});

const languageSchema = z.enum(["system", "pt-BR", "en-US", "es-ES"]).catch("system");

const keybindingsSchema = z
  .array(z.object({ action: z.string(), keys: z.string().nullable() }).nullable().catch(null))
  .catch([]);

export function readTheme(settings: Settings | null): ThemeSettings {
  return themeSchema.parse(settings?.theme ?? {});
}

export function readAppearance(settings: Settings | null): AppearanceSettings {
  return appearanceSchema.parse(settings?.appearance ?? {});
}

export function readLanguage(settings: Settings | null): LanguageSetting {
  return languageSchema.parse(settings?.language);
}

export function readKeybindings(settings: Settings | null): KeybindingOverride[] {
  return keybindingsSchema
    .parse(settings?.keybindings ?? [])
    .filter((b): b is KeybindingOverride => b !== null);
}
