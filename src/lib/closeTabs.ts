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
 * Fecha as abas, pedindo confirmação se alguma tiver um programa em execução
 * (configurável em Geral → "Confirmar antes de fechar").
 */
export async function requestCloseTabs(ids: string[], keepActive?: string): Promise<void> {
  const tabs = useSessions.getState().tabs.filter((t) => ids.includes(t.id));
  if (tabs.length === 0) return;

  const shouldAsk = useSettings.getState().settings?.general.confirmCloseRunning ?? true;
  if (shouldAsk) {
    const busy = (await Promise.all(tabs.map(async (t) => ((await isBusy(t)) ? t : null)))).filter(
      (t): t is TerminalTab => t !== null,
    );
    if (busy.length > 0) {
      const ok = await useUi.getState().askConfirm({
        title: i18n.t("closeConfirm.title"),
        message:
          busy.length === 1
            ? i18n.t("closeConfirm.message", { name: busy[0].title })
            : i18n.t("closeConfirm.messageMany", { count: busy.length }),
        confirmLabel: i18n.t("closeConfirm.confirm"),
        cancelLabel: i18n.t("closeConfirm.cancel"),
      });
      if (!ok) {
        focusActiveTerminal();
        return;
      }
    }
  }

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
