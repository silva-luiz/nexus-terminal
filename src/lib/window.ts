import { getCurrentWindow } from "@tauri-apps/api/window";

/** Controles da janela para a barra de título própria (a janela não tem bordas do Windows). */

export function minimizeWindow(): void {
  void getCurrentWindow().minimize();
}

export function toggleMaximizeWindow(): void {
  void getCurrentWindow().toggleMaximize();
}

/** Pede para fechar: passa pela confirmação de programas em execução (ver closeTabs.ts). */
export function closeWindow(): void {
  void getCurrentWindow().close();
}

export async function toggleFullscreen(): Promise<void> {
  const win = getCurrentWindow();
  await win.setFullscreen(!(await win.isFullscreen()));
}

/** Avisa quando a janela é maximizada ou restaurada. Retorna a função que para. */
export function watchMaximized(onChange: (maximized: boolean) => void): () => void {
  const win = getCurrentWindow();
  let stop: (() => void) | null = null;
  let cancelled = false;
  const check = () =>
    void win
      .isMaximized()
      .then(onChange)
      .catch(() => {});
  check();
  void win.onResized(check).then((unlisten) => {
    if (cancelled) unlisten();
    else stop = unlisten;
  });
  return () => {
    cancelled = true;
    stop?.();
  };
}
