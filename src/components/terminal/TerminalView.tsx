import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { openUrl } from "@tauri-apps/plugin-opener";
import "@xterm/xterm/css/xterm.css";

import i18n from "../../i18n";
import { pty } from "../../lib/ipc";
import {
  copySelection,
  pasteIntoActive,
  registerTerminal,
  unregisterTerminal,
} from "../../lib/terminals";
import { isAppShortcut } from "../../keybindings/useGlobalShortcuts";
import { useSessions, type TerminalTab } from "../../stores/sessions";
import { nexusDarkTerminal } from "../../themes/nexusDark";

interface Props {
  tab: TerminalTab;
  active: boolean;
}

const RESIZE_DEBOUNCE_MS = 50;

export function TerminalView({ tab, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { id: tabId, profileId, generation } = tab;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sessions = useSessions.getState;

    const term = new Terminal({
      fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 10_000,
      allowProposedApi: true,
      theme: nexusDarkTerminal,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new Unicode11Addon());
    term.unicode.activeVersion = "11";
    term.loadAddon(
      new WebLinksAddon((event, uri) => {
        if (event.ctrlKey) void openUrl(uri);
      }),
    );
    term.open(container);
    try {
      const webgl = new WebglAddon();
      // Sem GPU ou com muitos terminais o contexto pode ser perdido: volta ao renderizador padrão.
      webgl.onContextLoss(() => webgl.dispose());
      term.loadAddon(webgl);
    } catch {
      // WebGL indisponível: o renderizador DOM continua funcionando.
    }
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;
    registerTerminal(tabId, term);

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
      // Ctrl+C copia quando há seleção; sem seleção vai ao shell como interrupção.
      if (
        event.type === "keydown" &&
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        event.code === "KeyC" &&
        term.hasSelection()
      ) {
        copySelection(term);
        return false;
      }
      return !isAppShortcut(event);
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
      .spawn(profileId, term.cols, term.rows, (event) => {
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
      })
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
      dataSub.dispose();
      titleSub.dispose();
      resizeSub.dispose();
      if (sessionId) void pty.kill(sessionId);
      unregisterTerminal(tabId, term);
      termRef.current = null;
      fitRef.current = null;
      term.dispose();
    };
  }, [tabId, profileId, generation]);

  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      fitRef.current?.fit();
      termRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [active, generation]);

  return (
    <div
      className={`terminal-view${active ? " is-active" : ""}`}
      aria-hidden={!active}
      onContextMenu={(event) => {
        // Clique direito: copia se houver seleção, senão cola (estilo Windows Terminal).
        event.preventDefault();
        const term = termRef.current;
        if (term?.hasSelection()) copySelection(term);
        else pasteIntoActive(term ?? undefined);
      }}
    >
      <div ref={containerRef} className="terminal-host" />
    </div>
  );
}
