import { Channel, invoke } from "@tauri-apps/api/core";
import type { LoadedSettings, Settings } from "./types";

/** Único ponto do frontend que conversa com o backend (ver docs/03-architecture.md §3.3). */

export type PtyEvent = { type: "data"; data: string } | { type: "exit"; code: number | null };

export const pty = {
  spawn(
    profileId: string,
    cols: number,
    rows: number,
    onEvent: (event: PtyEvent) => void,
    cwd?: string,
  ): Promise<string> {
    const channel = new Channel<PtyEvent>();
    channel.onmessage = onEvent;
    return invoke<string>("pty_spawn", {
      profileId,
      cwd: cwd ?? null,
      cols,
      rows,
      onEvent: channel,
    });
  },

  write(sessionId: string, data: string): Promise<void> {
    return invoke("pty_write", { sessionId, data });
  },

  resize(sessionId: string, cols: number, rows: number): Promise<void> {
    return invoke("pty_resize", { sessionId, cols, rows });
  },

  kill(sessionId: string): Promise<void> {
    return invoke("pty_kill", { sessionId });
  },

  /** Há um programa rodando dentro do shell (ex.: node, ssh, vim)? */
  hasRunningProcess(sessionId: string): Promise<boolean> {
    return invoke<boolean>("pty_has_running_process", { sessionId });
  },
};

export const settingsApi = {
  load(): Promise<LoadedSettings> {
    return invoke<LoadedSettings>("settings_load");
  },

  /** Grava e devolve as configurações já normalizadas pelo backend. */
  save(settings: Settings): Promise<Settings> {
    return invoke<Settings>("settings_save", { settings });
  },

  /** Detecta os shells de novo e acrescenta os novos perfis. */
  redetect(): Promise<Settings> {
    return invoke<Settings>("shells_redetect");
  },
};

export const shells = {
  commandsExist(commands: string[]): Promise<boolean[]> {
    return invoke<boolean[]>("commands_exist", { commands });
  },
};

export const themesApi = {
  /** Temas do usuário como estão no disco (a validação é feita em themes/theme.ts). */
  list(): Promise<unknown[]> {
    return invoke<unknown[]>("themes_list");
  },

  readFile(path: string): Promise<unknown> {
    return invoke<unknown>("themes_read_file", { path });
  },

  save(theme: object): Promise<void> {
    return invoke("themes_save", { theme });
  },

  delete(id: string): Promise<void> {
    return invoke("themes_delete", { id });
  },
};

export const appApi = {
  /** Pasta passada com `-d` na linha de comando, se houver. */
  startDir(): Promise<string | null> {
    return invoke<string | null>("app_start_dir");
  },

  openFolder(folder: "config" | "logs"): Promise<void> {
    return invoke("open_app_folder", { folder });
  },
};
