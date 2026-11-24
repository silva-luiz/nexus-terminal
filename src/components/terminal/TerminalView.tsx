import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { openUrl } from "@tauri-apps/plugin-opener";
import "@xterm/xterm/css/xterm.css";

import i18n from "../../i18n";
import { pty } from "../../lib/ipc";
import {
  changeZoom,
  clearActiveTerminal,
  copySelection,
  getTerminalBehavior,
  getTerminalVisualOptions,
  pasteIntoActive,
  pasteText,
  registerTerminal,
  unregisterTerminal,
} from "../../lib/terminals";
import { shortcutLabel } from "../../keybindings/bindings";
import { isAppShortcut } from "../../keybindings/useGlobalShortcuts";
import { useSessions, type TerminalTab } from "../../stores/sessions";
import { useUi } from "../../stores/ui";
import { ContextMenu, type MenuEntry } from "../ui/ContextMenu";

interface Props {
  tab: TerminalTab;
  active: boolean;
}

const RESIZE_DEBOUNCE_MS = 50;

export function TerminalView({ tab, active }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const { id: tabId, profileId, generation, cwd } = tab;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sessions = useSessions.getState;
    const behavior = getTerminalBehavior();

    const term = new Terminal({
      ...getTerminalVisualOptions(),
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    const search = new SearchAddon();
    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(new Unicode11Addon());
    term.unicode.activeVersion = "11";
    term.loadAddon(
      new WebLinksAddon((event, uri) => {
        if (event.ctrlKey) void openUrl(uri);
      }),
    );
    term.open(container);
    if (behavior.renderer === "webgl") {
      try {
        const webgl = new WebglAddon();
        // Sem GPU ou com muitos terminais o contexto pode ser perdido: volta ao renderizador padrão.
        webgl.onContextLoss(() => webgl.dispose());
        term.loadAddon(webgl);
      } catch {
        // WebGL indisponível: o renderizador DOM continua funcionando.
      }
    }
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;
    registerTerminal(tabId, { term, fit, search });

    let sessionId: string | null = null;
    let disposed = false;
    let exited = false;
    const pending: string[] = [];
    // Encadeia as escritas: comandos async podem rodar fora de ordem no backend.
    let writeChain: Promise<unknown> = Promise.resolve();
    const write = (id: string, data: string) => {
      writeChain = writeChain.then(() => pty.write(id, data)).catch(() => {});
    };

    term.attachCustomKeyEventHandler((event) => {
      // Ctrl+C copia quando há seleção (configurável); sem seleção vai ao shell como interrupção.
      if (
        event.type === "keydown" &&
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        event.code === "KeyC" &&
        term.hasSelection() &&
        getTerminalBehavior().ctrlCCopiesSelection
      ) {
        copySelection(term);
        return false;
      }
      return !isAppShortcut(event);
    });

    // Ctrl+V nativo também passa pela confirmação de texto com várias linhas.
    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain") ?? "";
      event.preventDefault();
      event.stopImmediatePropagation();
      void pasteText(term, text);
    };
    term.textarea?.addEventListener("paste", onPaste, true);

    // Ctrl+roda do mouse: zoom.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      changeZoom(event.deltaY < 0 ? 1 : -1);
    };
    container.addEventListener("wheel", onWheel, { capture: true, passive: false });

    const selectionSub = term.onSelectionChange(() => {
      if (getTerminalBehavior().copyOnSelect && term.hasSelection()) {
        void navigator.clipboard.writeText(term.getSelection()).catch(() => {});
      }
    });

    const dataSub = term.onData((data) => {
      if (exited) {
        if (data === "\r") sessions().restart(tabId);
        return;
      }
      // O ConPTY pergunta a posição do cursor logo ao iniciar e espera a resposta,
      // que pode sair antes de o spawn terminar. Nada pode ser descartado.
      if (sessionId) write(sessionId, data);
      else pending.push(data);
    });
    const titleSub = term.onTitleChange((title) => sessions().setShellTitle(tabId, title));
    const resizeSub = term.onResize(({ cols, rows }) => {
      if (sessionId) void pty.resize(sessionId, cols, rows).catch(() => {});
    });

    const markExited = (message: string, code: number | null) => {
      exited = true;
      sessionId = null;
      sessions().setExited(tabId, code);
      term.write(`\r\n${message}\r\n`);
    };

    pty
      .spawn(
        profileId,
        term.cols,
        term.rows,
        (event) => {
          if (disposed) return;
          if (event.type === "data") {
            term.write(event.data);
          } else {
            const text =
              event.code === null
                ? i18n.t("terminal.exitedNoCode")
                : i18n.t("terminal.exited", { code: event.code });
            markExited(`\x1b[2m${text}\x1b[0m`, event.code);
          }
        },
        cwd,
      )
      .then((id) => {
        if (disposed) {
          void pty.kill(id);
          return;
        }
        if (exited) return;
        sessionId = id;
        sessions().setRunning(tabId, id);
        for (const data of pending.splice(0)) write(id, data);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        const text = i18n.t("terminal.spawnError", { error: String(error) });
        markExited(`\x1b[31m${text}\x1b[0m`, null);
      });

    let resizeTimer: number | undefined;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) fit.fit();
      }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(container);

    return () => {
      disposed = true;
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      container.removeEventListener("wheel", onWheel, { capture: true });
      term.textarea?.removeEventListener("paste", onPaste, true);
      selectionSub.dispose();
      dataSub.dispose();
      titleSub.dispose();
      resizeSub.dispose();
      if (sessionId) void pty.kill(sessionId);
      unregisterTerminal(tabId, term);
      termRef.current = null;
      fitRef.current = null;
      term.dispose();
    };
  }, [tabId, profileId, generation, cwd]);

  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      fitRef.current?.fit();
      termRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [active, generation]);

  const onContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    const term = termRef.current;
    if (!term) return;
    if (getTerminalBehavior().rightClickPaste) {
      // Estilo Windows Terminal: copia se houver seleção, senão cola.
      if (term.hasSelection()) copySelection(term);
      else pasteIntoActive(term);
      return;
    }
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: t("actions.terminal.copy"),
          hint: shortcutLabel("terminal.copy"),
          disabled: !term.hasSelection(),
          onSelect: () => copySelection(term),
        },
        {
          label: t("actions.terminal.paste"),
          hint: shortcutLabel("terminal.paste"),
          onSelect: () => pasteIntoActive(term),
        },
        "separator",
        {
          label: t("actions.terminal.find"),
          hint: shortcutLabel("terminal.find"),
          onSelect: () => useUi.getState().openSearch(),
        },
        {
          label: t("actions.terminal.clear"),
          hint: shortcutLabel("terminal.clear"),
          onSelect: () => clearActiveTerminal(),
        },
      ],
    });
  };

  return (
    <div
      className={`terminal-view${active ? " is-active" : ""}`}
      aria-hidden={!active}
      onContextMenu={onContextMenu}
    >
      <div ref={containerRef} className="terminal-host" />
      {menu && <ContextMenu {...menu} onClose={closeMenu} />}
    </div>
  );
}
