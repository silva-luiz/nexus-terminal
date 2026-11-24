import { describe, expect, it } from "vitest";
import { isDark, luminance, mix, parseHex } from "./color";
import { ANSI_KEYS, UI_KEYS, importThemes, normalizeTheme, themeToJson } from "./theme";
import { builtinThemes } from "./builtin";
import { resolveTheme, uniqueUserThemeId } from "./resolve";

const ansi = Object.fromEntries(ANSI_KEYS.map((k, i) => [k, `#${String(i).padStart(2, "0")}0000`]));

describe("cores", () => {
  it("lê hex curto e longo e mistura", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#5b8cff55")).toEqual({ r: 91, g: 140, b: 255 });
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("identifica fundo escuro", () => {
    expect(luminance("#000000")).toBe(0);
    expect(isDark("#282a36")).toBe(true);
    expect(isDark("#fdf6e3")).toBe(false);
  });
});

describe("temas embutidos", () => {
  it("todos são válidos, com IDs únicos e todas as cores", () => {
    const ids = builtinThemes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const theme of builtinThemes) {
      for (const key of UI_KEYS) expect(theme.ui[key], `${theme.id}.ui.${key}`).toBeTruthy();
      expect(theme.source).toBe("builtin");
    }
  });

  it("tem pelo menos um claro e um escuro", () => {
    expect(builtinThemes.some((t) => t.type === "dark")).toBe(true);
    expect(builtinThemes.some((t) => t.type === "light")).toBe(true);
  });
});

describe("importação", () => {
  it("aceita esquema do Windows Terminal (purple → magenta) e deduz o tipo", () => {
    const wt = {
      name: "Meu Esquema",
      background: "#101010",
      foreground: "#eeeeee",
      cursorColor: "#ff0000",
      ...ansi,
      magenta: undefined,
      brightMagenta: undefined,
      purple: "#aa00aa",
      brightPurple: "#ff00ff",
    };
    const [theme] = importThemes(wt);
    expect(theme).toMatchObject({ id: "meu-esquema", name: "Meu Esquema", type: "dark" });
    expect(theme.terminal.magenta).toBe("#aa00aa");
    expect(theme.terminal.brightMagenta).toBe("#ff00ff");
    expect(theme.terminal.cursor).toBe("#ff0000");
    expect(theme.ui.text).toBe("#eeeeee");
  });

  it("importa vários esquemas de um settings.json do Windows Terminal", () => {
    const scheme = { background: "#fafafa", foreground: "#111111", ...ansi };
    const themes = importThemes({
      schemes: [{ ...scheme, name: "A" }, { name: "inválido" }, { ...scheme, name: "B" }],
    });
    expect(themes.map((t) => t.name)).toEqual(["A", "B"]);
    expect(themes[0].type).toBe("light");
  });

  it("mantém cores de interface definidas no tema", () => {
    const theme = normalizeTheme({
      id: "x",
      name: "X",
      ui: { accent: "#123456", border: "não é cor" },
      terminal: { background: "#000000", foreground: "#ffffff", ...ansi },
    });
    expect(theme?.ui.accent).toBe("#123456");
  });

  it("recusa o que não é tema", () => {
    expect(normalizeTheme(null)).toBeNull();
    expect(normalizeTheme([1, 2])).toBeNull();
    expect(normalizeTheme({ background: "#000", foreground: "#fff" })).toBeNull();
    expect(importThemes({ hello: "world" })).toEqual([]);
  });

  it("formato gravado não leva o campo source e relê igual", () => {
    const json = themeToJson(builtinThemes[0]);
    expect(json).not.toHaveProperty("source");
    expect(normalizeTheme(json, "builtin")).toEqual(builtinThemes[0]);
  });
});

describe("escolha do tema", () => {
  const settings = { mode: "system" as const, dark: "dracula", light: "solarized-light" };

  it("segue o sistema ou o modo fixo", () => {
    expect(resolveTheme(settings, builtinThemes, true).id).toBe("dracula");
    expect(resolveTheme(settings, builtinThemes, false).id).toBe("solarized-light");
    expect(resolveTheme({ ...settings, mode: "dark" }, builtinThemes, false).id).toBe("dracula");
  });

  it("volta ao Nexus quando o tema não existe mais", () => {
    expect(resolveTheme({ ...settings, dark: "apagado" }, builtinThemes, true).id).toBe(
      "nexus-dark",
    );
    expect(resolveTheme({ ...settings, light: "apagado" }, builtinThemes, false).id).toBe(
      "nexus-light",
    );
  });

  it("não deixa tema importado substituir um embutido", () => {
    expect(uniqueUserThemeId("dracula", new Set(["dracula"]))).toBe("dracula-custom");
    expect(uniqueUserThemeId("meu", new Set(["dracula"]))).toBe("meu");
  });
});
