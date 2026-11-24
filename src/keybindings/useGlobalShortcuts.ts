import { useEffect } from "react";
import { comboFromEvent } from "./matcher";
import { blockedBrowserCombos, keybindingMap } from "./defaults";
import { runAction } from "./actions";
import { isModalOpen } from "../stores/ui";

export function isAppShortcut(event: KeyboardEvent): boolean {
  const combo = comboFromEvent(event);
  return combo !== null && keybindingMap.has(combo);
}

export function useGlobalShortcuts(): void {
  useEffect(() => {
    // Fase de captura: o app decide antes do xterm, que não recebe a tecla.
    const onKeyDown = (event: KeyboardEvent) => {
      const combo = comboFromEvent(event);
      if (!combo) return;
      // Com um diálogo aberto, as teclas ficam com o diálogo.
      const action = isModalOpen() ? undefined : keybindingMap.get(combo);
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        runAction(action);
      } else if (blockedBrowserCombos.has(combo)) {
        event.preventDefault();
      }
    };
    // Esconde o menu padrão do WebView (Recarregar, Inspecionar...).
    const onContextMenu = (event: MouseEvent) => {
      if (!import.meta.env.DEV) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);
}
