import { useSessions } from "../stores/sessions";
import { copySelection, pasteIntoActive } from "../lib/terminals";
import type { ActionId } from "./defaults";

/** Executa uma ação do app. Menus, atalhos e (no futuro) a paleta de comandos passam por aqui. */
export function runAction(action: ActionId): void {
  const s = useSessions.getState();

  const goTo = /^tab\.goTo\.(\d+)$/.exec(action);
  if (goTo) return s.activateIndex(Number(goTo[1]) - 1);

  const withProfile = /^tab\.newWithProfile\.(\d+)$/.exec(action);
  if (withProfile) {
    const profile = s.profiles[Number(withProfile[1]) - 1];
    if (profile) s.create(profile.id);
    return;
  }

  switch (action) {
    case "tab.new":
      s.create();
      return;
    case "tab.close":
      if (s.activeId) s.close(s.activeId);
      return;
    case "tab.rename":
      if (s.activeId) s.startRename(s.activeId);
      return;
    case "tab.next":
      return s.activateRelative(1);
    case "tab.prev":
      return s.activateRelative(-1);
    case "tab.goToLast":
      return s.activateLast();
    case "tab.moveLeft":
      return s.moveActive(-1);
    case "tab.moveRight":
      return s.moveActive(1);
    case "terminal.copy":
      return copySelection();
    case "terminal.paste":
      return pasteIntoActive();
  }
}
