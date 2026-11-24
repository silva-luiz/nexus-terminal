import type { ThemeSettings } from "../lib/types";
import { builtinThemes } from "./builtin";
import type { Theme } from "./theme";

/** Qual tema usar agora, conforme o modo (sistema/escuro/claro) e o tema do Windows. */
export function resolveTheme(settings: ThemeSettings, themes: Theme[], systemDark: boolean): Theme {
  const wantDark = settings.mode === "system" ? systemDark : settings.mode === "dark";
  const id = wantDark ? settings.dark : settings.light;
  const fallbackId = wantDark ? "nexus-dark" : "nexus-light";
  return (
    themes.find((t) => t.id === id) ??
    builtinThemes.find((t) => t.id === fallbackId) ??
    builtinThemes[0]
  );
}

/** Tema importado com o mesmo ID de um embutido ganha um sufixo para não substituí-lo. */
export function uniqueUserThemeId(id: string, builtinIds: Set<string>): string {
  return builtinIds.has(id) ? `${id}-custom`.slice(0, 64) : id;
}
