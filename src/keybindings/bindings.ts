import { create } from "zustand";
import type { KeybindingOverride } from "../lib/types";
import { defaultKeybindings, type ActionId } from "./defaults";
import { normalizeCombo } from "./matcher";

/** Atalho efetivo de cada ação (null = desativado). */
export type BindingMap = ReadonlyMap<ActionId, string | null>;

export const ALL_ACTIONS: readonly ActionId[] = defaultKeybindings.map((b) => b.action);
const DEFAULTS: BindingMap = new Map(defaultKeybindings.map((b) => [b.action, b.keys]));

export function isKnownAction(action: string): action is ActionId {
  return DEFAULTS.has(action as ActionId);
}

export function defaultBinding(action: ActionId): string | null {
  return DEFAULTS.get(action) ?? null;
}

/** Padrões + personalizações do usuário. Ações desconhecidas são ignoradas. */
export function effectiveBindings(overrides: KeybindingOverride[]): BindingMap {
  const map = new Map(DEFAULTS);
  for (const { action, keys } of overrides) {
    if (isKnownAction(action)) map.set(action, keys === null ? null : normalizeCombo(keys));
  }
  return map;
}

/** Combinação → ação. Se o arquivo tiver repetições, vale a primeira ação da lista. */
export function comboIndex(bindings: BindingMap): ReadonlyMap<string, ActionId> {
  const index = new Map<string, ActionId>();
  for (const action of ALL_ACTIONS) {
    const combo = bindings.get(action);
    if (combo && !index.has(combo)) index.set(combo, action);
  }
  return index;
}

export function findConflict(
  bindings: BindingMap,
  action: ActionId,
  combo: string,
): ActionId | null {
  for (const [other, keys] of bindings) {
    if (other !== action && keys === combo) return other;
  }
  return null;
}

/** Define o atalho de uma ação, guardando só o que difere do padrão. */
export function withBinding(
  overrides: KeybindingOverride[],
  action: ActionId,
  keys: string | null,
): KeybindingOverride[] {
  const rest = overrides.filter((o) => o.action !== action);
  const normalized = keys === null ? null : normalizeCombo(keys);
  return normalized === defaultBinding(action) ? rest : [...rest, { action, keys: normalized }];
}

/**
 * Atalhos precisam de Ctrl, Alt ou Win (ou ser uma tecla F), para não roubar
 * teclas normais de digitação do shell.
 */
export function isAssignableCombo(combo: string): boolean {
  const parts = combo.split("+");
  const key = parts[parts.length - 1];
  if (!key || ["ctrl", "alt", "shift", "meta"].includes(key)) return false;
  if (/^f([1-9]|1\d|2[0-4])$/.test(key)) return true;
  return parts.slice(0, -1).some((m) => m === "ctrl" || m === "alt" || m === "meta");
}

const KEY_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Win",
  pageup: "PageUp",
  pagedown: "PageDown",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  enter: "Enter",
  escape: "Esc",
  space: "Espaço",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  home: "Home",
  end: "End",
  tab: "Tab",
};

/** "ctrl+shift+pageup" → "Ctrl+Shift+PageUp" */
export function formatCombo(combo: string): string {
  return combo
    .split("+")
    .map((part) => KEY_LABELS[part] ?? part.toUpperCase())
    .join("+");
}

interface KeybindingsState {
  bindings: BindingMap;
  byCombo: ReadonlyMap<string, ActionId>;
  setOverrides(overrides: KeybindingOverride[]): void;
}

export const useKeybindings = create<KeybindingsState>((set) => ({
  bindings: DEFAULTS,
  byCombo: comboIndex(DEFAULTS),
  setOverrides(overrides) {
    const bindings = effectiveBindings(overrides);
    set({ bindings, byCombo: comboIndex(bindings) });
  },
}));

/** Texto do atalho atual da ação, para menus e dicas. */
export function shortcutLabel(action: ActionId): string | undefined {
  const combo = useKeybindings.getState().bindings.get(action);
  return combo ? formatCombo(combo) : undefined;
}

export function useShortcutLabel(action: ActionId): string | undefined {
  const combo = useKeybindings((s) => s.bindings.get(action));
  return combo ? formatCombo(combo) : undefined;
}
