import type { ITheme, Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import type { SearchAddon } from "@xterm/addon-search";
import i18n from "../i18n";
import type { CursorStyle } from "./types";
import { useSessions } from "../stores/sessions";
import { useUi } from "../stores/ui";

/** Opções visuais compartilhadas por todos os terminais (tema, aparência e avançado). */
export interface TerminalVisualOptions {
  theme: ITheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  scrollback: number;
  screenReaderMode: boolean;
}

/** Comportamento de copiar/colar e renderizador (lidos na hora do uso). */
export interface TerminalBehavior {
  copyOnSelect: boolean;
  rightClickPaste: boolean;
  ctrlCCopiesSelection: boolean;
  confirmMultilinePaste: boolean;
  renderer: "webgl" | "dom";
}

interface Entry {
  term: Terminal;
  fit: FitAddon;
  search: SearchAddon;
}

export const ZOOM = { min: -6, max: 20 } as const;
const MIN_FONT_SIZE = 6;

/** Instâncias do xterm por aba, para copiar, colar, focar, buscar e trocar o tema. */
const terminals = new Map<string, Entry>();

let visualOptions: TerminalVisualOptions = {
  theme: {},
  fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: "bar",
  cursorBlink: true,
  scrollback: 10_000,
  screenReaderMode: false,
};

let behavior: TerminalBehavior = {
  copyOnSelect: false,
  rightClickPaste: true,
  ctrlCCopiesSelection: true,
  confirmMultilinePaste: true,
  renderer: "webgl",
};

/** Zoom da sessão (não é salvo): pontos somados ao tamanho da fonte. */
let zoom = 0;

export function registerTerminal(tabId: string, entry: Entry): void {
  terminals.set(tabId, entry);
}

export function unregisterTerminal(tabId: string, term: Terminal): void {
  if (terminals.get(tabId)?.term === term) terminals.delete(tabId);
}

function effectiveOptions(): TerminalVisualOptions {
  return {
    ...visualOptions,
    fontSize: Math.max(MIN_FONT_SIZE, visualOptions.fontSize + zoom),
  };
}

/** Opções para criar um terminal novo. */
export function getTerminalVisualOptions(): TerminalVisualOptions {
  return effectiveOptions();
}

export function getTerminalBehavior(): TerminalBehavior {
  return behavior;
}

export function setTerminalBehavior(next: TerminalBehavior): void {
  behavior = next;
}

function applyToAll(): void {
  const options = effectiveOptions();
  for (const { term, fit } of terminals.values()) {
    Object.assign(term.options, options);
    // Fonte nova muda o tamanho das células: recalcula colunas/linhas se o terminal estiver visível.
    if (term.element && term.element.clientWidth > 0) fit.fit();
  }
}

/** Aplica tema/fonte/cursor em todos os terminais abertos e nos próximos. */
export function setTerminalVisualOptions(options: TerminalVisualOptions): void {
  visualOptions = options;
  applyToAll();
}

export function changeZoom(delta: number | "reset"): void {
  const next = delta === "reset" ? 0 : Math.max(ZOOM.min, Math.min(ZOOM.max, zoom + delta));
  if (next === zoom) return;
  zoom = next;
  applyToAll();
}

/** `Fira Code` → `"Fira Code", "Cascadia Mono", Consolas, monospace` */
export function buildFontStack(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (trimmed.includes(",")) return trimmed;
  const quoted = trimmed.startsWith('"') ? trimmed : `"${trimmed}"`;
  return `${quoted}, "Cascadia Mono", Consolas, monospace`;
}

function activeEntry(): Entry | undefined {
  const id = useSessions.getState().activeId;
  return id ? terminals.get(id) : undefined;
}

export function getActiveSearch(): SearchAddon | undefined {
  return activeEntry()?.search;
}

export function focusActiveTerminal(): void {
  activeEntry()?.term.focus();
}

export function clearActiveTerminal(): void {
  activeEntry()?.term.clear();
}

export function copySelection(term: Terminal | undefined = activeEntry()?.term): void {
  const text = term?.getSelection();
  if (!term || !text) return;
  void navigator.clipboard.writeText(text);
  term.clearSelection();
}

export function isMultiline(text: string): boolean {
  return /\r|\n/.test(text.replace(/(\r?\n)+$/, ""));
}

/** Cola no terminal, pedindo confirmação para texto com várias linhas (se configurado). */
export async function pasteText(term: Terminal, text: string): Promise<void> {
  if (!text) return;
  if (behavior.confirmMultilinePaste && isMultiline(text)) {
    const lines = text.split(/\r?\n/).length;
    const preview = text.length > 300 ? `${text.slice(0, 300)}…` : text;
    const ok = await useUi.getState().askConfirm({
      title: i18n.t("paste.title"),
      message: i18n.t("paste.message", { count: lines, preview }),
      confirmLabel: i18n.t("paste.confirm"),
      cancelLabel: i18n.t("paste.cancel"),
    });
    term.focus();
    if (!ok) return;
  }
  term.paste(text);
}

export function pasteIntoActive(term: Terminal | undefined = activeEntry()?.term): void {
  if (!term) return;
  void navigator.clipboard
    .readText()
    .then((text) => pasteText(term, text))
    .catch(() => {});
}
