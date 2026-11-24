import { describe, expect, it } from "vitest";
import type { Settings } from "../lib/types";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_CLIPBOARD,
  DEFAULT_LAYOUT,
  readLayout,
  DEFAULT_TERMINAL,
  readClipboard,
  readTerminal,
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

describe("tema", () => {
  const withTheme = (theme: unknown) => ({ ...base, theme }) as unknown as Settings;

  it("usa o tema escolhido", () => {
    expect(readTheme(withTheme({ selected: "nord" }))).toEqual({ selected: "nord" });
  });

  it("mantém a escolha de configurações antigas (modo + tema escuro/claro)", () => {
    const old = { dark: "dracula", light: "solarized-light" };
    expect(readTheme(withTheme({ ...old, mode: "light" })).selected).toBe("solarized-light");
    expect(readTheme(withTheme({ ...old, mode: "dark" })).selected).toBe("dracula");
    expect(readTheme(withTheme({ ...old, mode: "system" })).selected).toBe("dracula");
    expect(readTheme(withTheme({ ...old, mode: "system", selected: "nord" })).selected).toBe(
      "nord",
    );
  });
});

describe("leitura com padrões", () => {
  it("arquivo antigo sem as seções novas usa os padrões", () => {
    expect(readTheme(base)).toEqual(DEFAULT_THEME);
    expect(readAppearance(base)).toEqual(DEFAULT_APPEARANCE);
    expect(readLanguage(base)).toBe("system");
    expect(readKeybindings(base)).toEqual([]);
    expect(readTheme(null)).toEqual(DEFAULT_THEME);
    expect(readClipboard(base)).toEqual(DEFAULT_CLIPBOARD);
    expect(readTerminal(base)).toEqual(DEFAULT_TERMINAL);
    expect(readLayout(base)).toEqual(DEFAULT_LAYOUT);
  });

  it("campo inválido cai no padrão sem afetar os outros", () => {
    const s = {
      ...base,
      theme: { selected: 42 },
      appearance: { fontFamily: "Fira Code", fontSize: 999, cursorStyle: "block" },
      language: "fr-FR",
      general: { ...base.general, copyOnSelect: true, rightClickPaste: "sim" },
      terminal: { scrollback: 50, renderer: "dom" },
      layout: { tabPosition: "left", viewMode: "mosaico", gridColumns: 9, sidebarWidth: 300 },
      keybindings: [{ action: "tab.new", keys: "ctrl+t" }, "lixo", { action: "x", keys: null }],
    } as unknown as Settings;
    expect(readTheme(s)).toEqual(DEFAULT_THEME);
    expect(readAppearance(s)).toEqual({
      ...DEFAULT_APPEARANCE,
      fontFamily: "Fira Code",
      cursorStyle: "block",
    });
    expect(readLanguage(s)).toBe("system");
    expect(readClipboard(s)).toEqual({ ...DEFAULT_CLIPBOARD, copyOnSelect: true });
    expect(readTerminal(s)).toEqual({ ...DEFAULT_TERMINAL, renderer: "dom" });
    expect(readLayout(s)).toEqual({ ...DEFAULT_LAYOUT, tabPosition: "left", sidebarWidth: 300 });
    expect(readKeybindings(s)).toEqual([
      { action: "tab.new", keys: "ctrl+t" },
      { action: "x", keys: null },
    ]);
  });
});
