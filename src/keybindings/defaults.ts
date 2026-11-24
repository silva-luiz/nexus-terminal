/** Atalhos padrão (docs/05-configuracoes.md §5.4). Na Fase 4 o usuário poderá alterá-los. */

export type ActionId =
  | "tab.new"
  | `tab.newWithProfile.${number}`
  | "tab.close"
  | "tab.rename"
  | "tab.next"
  | "tab.prev"
  | `tab.goTo.${number}`
  | "tab.goToLast"
  | "tab.moveLeft"
  | "tab.moveRight"
  | "terminal.copy"
  | "terminal.paste"
  | "app.settings";

export interface Keybinding {
  action: ActionId;
  keys: string;
}

const goTo: Keybinding[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  action: `tab.goTo.${n}` as ActionId,
  keys: `ctrl+${n}`,
}));

const newWithProfile: Keybinding[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  action: `tab.newWithProfile.${n}` as ActionId,
  keys: `ctrl+shift+${n}`,
}));

export const defaultKeybindings: Keybinding[] = [
  { action: "tab.new", keys: "ctrl+shift+t" },
  { action: "tab.close", keys: "ctrl+shift+w" },
  { action: "tab.rename", keys: "f2" },
  { action: "tab.next", keys: "ctrl+tab" },
  { action: "tab.prev", keys: "ctrl+shift+tab" },
  ...goTo,
  { action: "tab.goToLast", keys: "ctrl+9" },
  { action: "tab.moveLeft", keys: "ctrl+shift+pageup" },
  { action: "tab.moveRight", keys: "ctrl+shift+pagedown" },
  ...newWithProfile,
  { action: "terminal.copy", keys: "ctrl+shift+c" },
  { action: "terminal.paste", keys: "ctrl+shift+v" },
  { action: "app.settings", keys: "ctrl+," },
];

export const keybindingMap: ReadonlyMap<string, ActionId> = new Map(
  defaultKeybindings.map((b) => [b.keys, b.action]),
);

export function shortcutFor(action: ActionId): string | undefined {
  return defaultKeybindings.find((b) => b.action === action)?.keys;
}

/** Atalhos do navegador que recarregariam a interface e apagariam os terminais. */
export const blockedBrowserCombos = new Set(["f5", "ctrl+r", "ctrl+shift+r", "ctrl+f5"]);
