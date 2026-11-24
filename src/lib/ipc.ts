import { Channel, invoke } from "@tauri-apps/api/core";

/** Único ponto do frontend que conversa com o backend (ver docs/03-arquitetura.md §3.3). */

export type PtyEvent = { type: "data"; data: string } | { type: "exit"; code: number | null };

export interface ShellProfileInfo {
  id: string;
  name: string;
}

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
};

export const shells = {
  list(): Promise<ShellProfileInfo[]> {
    return invoke<ShellProfileInfo[]>("shells_list");
  },
};
