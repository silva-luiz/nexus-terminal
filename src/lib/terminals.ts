import type { ITheme, Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import type { CursorStyle } from "./types";
import { useSessions } from "../stores/sessions";

/** Opções visuais compartilhadas por todos os terminais (tema + aparência). */
export interface TerminalVisualOptions {
  theme: ITheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
}

interface Entry {
  term: Terminal;
  fit: FitAddon;
}

/** Instâncias do xterm por aba, para ações como copiar, colar, focar e trocar o tema. */
const terminals = new Map<string, Entry>();

let visualOptions: TerminalVisualOptions = {
  theme: {},
  fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: "bar",
  cursorBlink: true,
};

export function registerTerminal(tabId: string, term: Terminal, fit: FitAddon): void {
  terminals.set(tabId, { term, fit });
}

export function unregisterTerminal(tabId: string, term: Terminal): void {
  if (terminals.get(tabId)?.term === term) terminals.delete(tabId);
}

export function getTerminalVisualOptions(): TerminalVisualOptions {
  return visualOptions;
}

/** Aplica tema/fonte/cursor em todos os terminais abertos e nos próximos. */
export function setTerminalVisualOptions(options: TerminalVisualOptions): void {
  visualOptions = options;
  for (const { term, fit } of terminals.values()) {
    Object.assign(term.options, options);
    // Fonte nova muda o tamanho das células: recalcula colunas/linhas se o terminal estiver visível.
    if (term.element && term.element.clientWidth > 0) fit.fit();
  }
}

/** `Fira Code` → `"Fira Code", "Cascadia Mono", Consolas, monospace` */
export function buildFontStack(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (trimmed.includes(",")) return trimmed;
  const quoted = trimmed.startsWith('"') ? trimmed : `"${trimmed}"`;
  return `${quoted}, "Cascadia Mono", Consolas, monospace`;
}

function activeTerminal(): Terminal | undefined {
  const id = useSessions.getState().activeId;
  return id ? terminals.get(id)?.term : undefined;
}

export function focusActiveTerminal(): void {
  activeTerminal()?.focus();
}

export function copySelection(term: Terminal | undefined = activeTerminal()): void {
  const text = term?.getSelection();
  if (!term || !text) return;
  void navigator.clipboard.writeText(text);
  term.clearSelection();
}

export function pasteIntoActive(term: Terminal | undefined = activeTerminal()): void {
  if (!term) return;
  void navigator.clipboard
    .readText()
    .then((text) => {
      if (text) term.paste(text);
    })
    .catch(() => {});
}
