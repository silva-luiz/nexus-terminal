import { create } from "zustand";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve(ok: boolean): void;
}

interface UiState {
  settingsOpen: boolean;
  confirm: ConfirmRequest | null;
  openSettings(): void;
  closeSettings(): void;
  /** Mostra o diálogo de confirmação e resolve com a escolha do usuário. */
  askConfirm(request: Omit<ConfirmRequest, "resolve">): Promise<boolean>;
  answerConfirm(ok: boolean): void;
}

export const useUi = create<UiState>((set, get) => ({
  settingsOpen: false,
  confirm: null,

  openSettings() {
    set({ settingsOpen: true });
  },

  closeSettings() {
    set({ settingsOpen: false });
  },

  askConfirm(request) {
    // Uma pergunta anterior sem resposta conta como "cancelar".
    get().confirm?.resolve(false);
    return new Promise<boolean>((resolve) => set({ confirm: { ...request, resolve } }));
  },

  answerConfirm(ok) {
    const current = get().confirm;
    set({ confirm: null });
    current?.resolve(ok);
  },
}));

export function isModalOpen(): boolean {
  const { settingsOpen, confirm } = useUi.getState();
  return settingsOpen || confirm !== null;
}
