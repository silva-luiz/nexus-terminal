import type { ThemeSettings } from "../lib/types";
import { builtinThemes } from "./builtin";
import type { Theme } from "./theme";

/** Tema em uso. Se o escolhido não existir mais (ex.: tema importado excluído), usa o Nexus Dark. */
export function resolveTheme(settings: ThemeSettings, themes: Theme[]): Theme {
  return (
    themes.find((t) => t.id === settings.selected) ??
    builtinThemes.find((t) => t.id === "nexus-dark") ??
    builtinThemes[0]
  );
}

/** Tema importado com o mesmo ID de um embutido ganha um sufixo para não substituí-lo. */
export function uniqueUserThemeId(id: string, builtinIds: Set<string>): string {
  return builtinIds.has(id) ? `${id}-custom`.slice(0, 64) : id;
}
