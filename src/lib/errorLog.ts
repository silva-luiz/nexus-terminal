import { error as logError } from "@tauri-apps/plugin-log";

/** Registra erros não tratados da interface no mesmo arquivo de log do backend. */
export function installErrorLogging(): void {
  window.addEventListener("error", (event) => {
    void logError(`[ui] ${event.message} (${event.filename}:${event.lineno})`).catch(() => {});
  });
  window.addEventListener("unhandledrejection", (event) => {
    void logError(`[ui] promessa rejeitada: ${String(event.reason)}`).catch(() => {});
  });
}
