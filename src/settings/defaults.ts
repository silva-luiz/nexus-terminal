import { z } from "zod";
import type {
  AppearanceSettings,
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
