import type { Terminal } from "@xterm/xterm";
import { useSessions } from "../stores/sessions";

/** Instâncias do xterm por aba, para ações como copiar, colar e focar. */
const terminals = new Map<string, Terminal>();

export function registerTerminal(tabId: string, term: Terminal): void {
  terminals.set(tabId, term);
}

export function unregisterTerminal(tabId: string, term: Terminal): void {
  if (terminals.get(tabId) === term) terminals.delete(tabId);
}

function activeTerminal(): Terminal | undefined {
  const id = useSessions.getState().activeId;
  return id ? terminals.get(id) : undefined;
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
