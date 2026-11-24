import { create } from "zustand";
import { settingsApi } from "../lib/ipc";
import type { Settings } from "../lib/types";

interface SettingsState {
  settings: Settings | null;
  /** Aviso de arquivo inválido vindo do backend. */
  warning: string | null;
  /** Último erro ao salvar. */
  error: string | null;
  load(): Promise<void>;
  /** Aplica a alteração na hora e grava; volta ao estado anterior se a gravação falhar. */
  update(change: (current: Settings) => Settings): Promise<void>;
  redetect(): Promise<void>;
  dismissWarning(): void;
  dismissError(): void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: null,
  warning: null,
  error: null,

  async load() {
    const loaded = await settingsApi.load();
    set({ settings: loaded.settings, warning: loaded.warning });
  },

  async update(change) {
    const previous = get().settings;
    if (!previous) return;
    const next = change(previous);
    set({ settings: next, error: null });
    try {
      const saved = await settingsApi.save(next);
      // Só aplica a versão normalizada se ninguém alterou nada enquanto gravava.
      if (get().settings === next) set({ settings: saved, warning: null });
    } catch (err) {
      set({ settings: previous, error: String(err) });
    }
  },

  async redetect() {
    try {
      set({ settings: await settingsApi.redetect(), error: null, warning: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  dismissWarning() {
    set({ warning: null });
  },

  dismissError() {
    set({ error: null });
  },
}));
