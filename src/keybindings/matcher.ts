/**
 * Converte eventos de teclado em combinações normalizadas, ex.: "ctrl+shift+t".
 * Usa `event.code` (tecla física) para funcionar igual em teclados ABNT2 e US.
 */

type KeyLike = Pick<KeyboardEvent, "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;

const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"] as const;
const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
  "MetaLeft",
  "MetaRight",
]);

const CODE_ALIASES: Record<string, string> = {
  Equal: "=",
  Minus: "-",
  NumpadAdd: "=",
  NumpadSubtract: "-",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export function keyFromCode(code: string): string {
  if (CODE_ALIASES[code]) return CODE_ALIASES[code];
  if (code.startsWith("Key")) return code.slice(3).toLowerCase();
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad") && /^\d$/.test(code.slice(6))) return code.slice(6);
  return code.toLowerCase();
}

/** Retorna null quando só um modificador foi pressionado. */
export function comboFromEvent(event: KeyLike): string | null {
  if (MODIFIER_CODES.has(event.code)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");
  parts.push(keyFromCode(event.code));
  return parts.join("+");
}

/** Normaliza combinações escritas à mão: "Shift+Ctrl+T" → "ctrl+shift+t". */
export function normalizeCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p === "control" ? "ctrl" : p === "win" || p === "cmd" ? "meta" : p));
  const modifiers = MODIFIER_ORDER.filter((m) => parts.includes(m));
  const keys = parts.filter((p) => !(MODIFIER_ORDER as readonly string[]).includes(p));
  return [...modifiers, ...keys].join("+");
}
