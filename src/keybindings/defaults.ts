/** Atalhos padrão (docs/05-configuracoes.md §5.4). As personalizações ficam em bindings.ts. */

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
  | "terminal.find"
  | "terminal.clear"
  | "terminal.zoomIn"
  | "terminal.zoomOut"
  | "terminal.zoomReset"
  | "app.settings"
  | "app.toggleFullscreen";

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
  { action: "terminal.find", keys: "ctrl+shift+f" },
  { action: "terminal.clear", keys: "ctrl+shift+k" },
  { action: "terminal.zoomIn", keys: "ctrl+=" },
  { action: "terminal.zoomOut", keys: "ctrl+-" },
  { action: "terminal.zoomReset", keys: "ctrl+0" },
  { action: "app.settings", keys: "ctrl+," },
  { action: "app.toggleFullscreen", keys: "f11" },
];

/** Atalhos do navegador que recarregariam a interface e apagariam os terminais. */
export const blockedBrowserCombos = new Set(["f5", "ctrl+r", "ctrl+shift+r", "ctrl+f5"]);
