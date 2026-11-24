import { create } from "zustand";
import i18n from "../i18n";
import { themesApi } from "../lib/ipc";
import { BUILTIN_IDS, builtinThemes } from "../themes/builtin";
import { uniqueUserThemeId } from "../themes/resolve";
import { importThemes, normalizeTheme, themeToJson, type Theme } from "../themes/theme";

interface ThemesState {
  userThemes: Theme[];
  load(): Promise<void>;
  /** Importa um arquivo e devolve os temas adicionados. */
  importFile(path: string): Promise<Theme[]>;
  remove(id: string): Promise<void>;
}

export const useThemes = create<ThemesState>((set, get) => ({
  userThemes: [],

  async load() {
    const raw = await themesApi.list();
    const userThemes = raw
      .map((t) => normalizeTheme(t, "user"))
      .filter((t): t is Theme => t !== null && !BUILTIN_IDS.has(t.id));
    set({ userThemes });
  },

  async importFile(path) {
    const themes = importThemes(await themesApi.readFile(path)).map((t) => ({
      ...t,
      id: uniqueUserThemeId(t.id, BUILTIN_IDS),
    }));
    if (themes.length === 0) throw new Error(i18n.t("settings.appearance.importInvalid"));
    for (const theme of themes) await themesApi.save(themeToJson(theme));
    await get().load();
    return themes;
  },

  async remove(id) {
    await themesApi.delete(id);
    await get().load();
  },
}));

export function allThemes(userThemes: Theme[]): Theme[] {
  return [...builtinThemes, ...userThemes];
}
