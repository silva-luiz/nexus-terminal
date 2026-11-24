import type { ITheme } from "@xterm/xterm";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UI_KEYS, type Theme } from "./theme";

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

let applied: Theme | null = null;

/** Tema em uso agora (para cores calculadas em código, como os destaques da busca). */
export function getAppliedTheme(): Theme | null {
  return applied;
}

/** Cores da interface viram variáveis CSS (`ui.textMuted` → `--color-text-muted`). */
export function applyUiTheme(theme: Theme): void {
  applied = theme;
  const root = document.documentElement;
  for (const key of UI_KEYS) root.style.setProperty(`--color-${kebab(key)}`, theme.ui[key]);
  // Controles nativos (select, barras de rolagem) seguem o tipo do tema.
  root.style.colorScheme = theme.type;
  root.dataset.theme = theme.type;
  // Barra de título do Windows clara ou escura.
  getCurrentWindow()
    .setTheme(theme.type)
    .catch(() => {});
}

export function terminalTheme(theme: Theme): ITheme {
  return { ...theme.terminal };
}
