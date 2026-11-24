import { getCurrentWindow } from "@tauri-apps/api/window";
import i18n from "../i18n";
import { pty } from "./ipc";
import { focusActiveTerminal } from "./terminals";
import { useSessions, type TerminalTab } from "../stores/sessions";
import { useSettings } from "../stores/settings";
import { useUi } from "../stores/ui";

async function isBusy(tab: TerminalTab): Promise<boolean> {
  if (!tab.sessionId) return false;
  try {
    return await pty.hasRunningProcess(tab.sessionId);
  } catch {
    return false;
  }
}

/**
 * Se a confirmação estiver ligada e alguma aba tiver um programa em execução, pergunta ao
 * usuário. Retorna true se pode fechar.
 */
async function confirmIfBusy(tabs: TerminalTab[], title: string): Promise<boolean> {
  const shouldAsk = useSettings.getState().settings?.general.confirmCloseRunning ?? true;
  if (!shouldAsk || tabs.length === 0) return true;
  const busy = (await Promise.all(tabs.map(async (t) => ((await isBusy(t)) ? t : null)))).filter(
    (t): t is TerminalTab => t !== null,
  );
  if (busy.length === 0) return true;
  const ok = await useUi.getState().askConfirm({
    title,
    message:
      busy.length === 1
        ? i18n.t("closeConfirm.message", { name: busy[0].title })
        : i18n.t("closeConfirm.messageMany", { count: busy.length }),
    confirmLabel: i18n.t("closeConfirm.confirm"),
    cancelLabel: i18n.t("closeConfirm.cancel"),
  });
  if (!ok) focusActiveTerminal();
  return ok;
}

/**
 * Fecha as abas, pedindo confirmação se alguma tiver um programa em execução
 * (configurável em Geral → "Confirmar antes de fechar").
 */
export async function requestCloseTabs(ids: string[], keepActive?: string): Promise<void> {
  const tabs = useSessions.getState().tabs.filter((t) => ids.includes(t.id));
  if (tabs.length === 0) return;
  if (!(await confirmIfBusy(tabs, i18n.t("closeConfirm.title")))) return;

  const sessions = useSessions.getState();
  for (const tab of tabs) sessions.close(tab.id);
  if (keepActive) sessions.activate(keepActive);
  focusActiveTerminal();
}

export function requestCloseTab(id: string): Promise<void> {
  return requestCloseTabs([id]);
}

export function requestCloseOthers(id: string): Promise<void> {
  const ids = useSessions
    .getState()
    .tabs.map((t) => t.id)
    .filter((x) => x !== id);
  return requestCloseTabs(ids, id);
}

export function requestCloseToRight(id: string): Promise<void> {
  const tabs = useSessions.getState().tabs;
  const index = tabs.findIndex((t) => t.id === id);
  return requestCloseTabs(
    tabs.slice(index + 1).map((t) => t.id),
    id,
  );
}

/** Ao fechar a janela (botão ×, Alt+F4), confirma se há programas rodando. Retorna a função que para. */
export function watchWindowClose(): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;
  void getCurrentWindow()
    .onCloseRequested(async (event) => {
      const tabs = useSessions.getState().tabs;
      if (!(await confirmIfBusy(tabs, i18n.t("closeConfirm.windowTitle")))) event.preventDefault();
    })
    .then((unlisten) => {
      if (cancelled) unlisten();
      else stop = unlisten;
    });
  return () => {
    cancelled = true;
    stop?.();
  };
}
