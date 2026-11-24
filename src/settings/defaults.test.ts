import { describe, expect, it } from "vitest";
import type { Settings } from "../lib/types";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_THEME,
  readAppearance,
  readKeybindings,
  readLanguage,
  readTheme,
} from "./defaults";

const base: Settings = {
  version: 1,
  general: { defaultProfile: "a", confirmCloseRunning: true },
  profiles: [],
};

describe("leitura com padrões", () => {
  it("arquivo antigo sem as seções novas usa os padrões", () => {
    expect(readTheme(base)).toEqual(DEFAULT_THEME);
    expect(readAppearance(base)).toEqual(DEFAULT_APPEARANCE);
    expect(readLanguage(base)).toBe("system");
    expect(readKeybindings(base)).toEqual([]);
    expect(readTheme(null)).toEqual(DEFAULT_THEME);
  });

  it("campo inválido cai no padrão sem afetar os outros", () => {
    const s = {
      ...base,
      theme: { mode: "roxo", dark: "dracula" },
      appearance: { fontFamily: "Fira Code", fontSize: 999, cursorStyle: "block" },
      language: "fr-FR",
      keybindings: [{ action: "tab.new", keys: "ctrl+t" }, "lixo", { action: "x", keys: null }],
    } as unknown as Settings;
    expect(readTheme(s)).toEqual({ ...DEFAULT_THEME, dark: "dracula" });
    expect(readAppearance(s)).toEqual({
      ...DEFAULT_APPEARANCE,
      fontFamily: "Fira Code",
      cursorStyle: "block",
    });
    expect(readLanguage(s)).toBe("system");
    expect(readKeybindings(s)).toEqual([
      { action: "tab.new", keys: "ctrl+t" },
      { action: "x", keys: null },
    ]);
  });
});
