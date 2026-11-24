import { create } from "zustand";

/** Perfil visível no menu de nova aba (vem das configurações). */
export interface ShellProfileInfo {
  id: string;
  name: string;
}

export type TabStatus = "starting" | "running" | "exited";

export interface TerminalTab {
  id: string;
  profileId: string;
  /** Nome automático: nome do perfil + número. */
  defaultTitle: string;
  /** Nome exibido. */
  title: string;
  /** true depois que o usuário renomeia; o shell não sobrescreve mais o título. */
  titleLocked: boolean;
  status: TabStatus;
  exitCode: number | null;
  /** ID da sessão no backend enquanto o processo está rodando. */
  sessionId: string | null;
  /** Incrementa a cada reinício para recriar o terminal. */
  generation: number;
}

export const MAX_TITLE_LENGTH = 60;
export const FALLBACK_PROFILE_ID = "powershell";

interface SessionsState {
  profiles: ShellProfileInfo[];
  defaultProfileId: string;
  tabs: TerminalTab[];
  activeId: string | null;
  renamingId: string | null;
  counters: Record<string, number>;

  setProfiles(profiles: ShellProfileInfo[], defaultProfileId: string): void;
  ensureOne(): void;
  create(profileId?: string): string;
  close(id: string): void;
  activate(id: string): void;
  activateIndex(index: number): void;
  activateLast(): void;
  activateRelative(delta: number): void;
  move(id: string, toIndex: number): void;
  moveActive(delta: number): void;
  startRename(id: string | null): void;
  rename(id: string, title: string): void;
  setShellTitle(id: string, title: string): void;
  setRunning(id: string, sessionId: string): void;
  setExited(id: string, exitCode: number | null): void;
  restart(id: string): void;
}

let nextLocalId = 0;
function newTabId(): string {
  nextLocalId += 1;
  return `tab-${Date.now().toString(36)}-${nextLocalId}`;
}

function updateTab(
  tabs: TerminalTab[],
  id: string,
  patch: (tab: TerminalTab) => Partial<TerminalTab>,
): TerminalTab[] {
  return tabs.map((tab) => (tab.id === id ? { ...tab, ...patch(tab) } : tab));
}

export const useSessions = create<SessionsState>((set, get) => ({
  profiles: [],
  defaultProfileId: FALLBACK_PROFILE_ID,
  tabs: [],
  activeId: null,
  renamingId: null,
  counters: {},

  setProfiles(profiles, defaultProfileId) {
    set({ profiles, defaultProfileId });
  },

  ensureOne() {
    if (get().tabs.length === 0) get().create();
  },

  create(profileId) {
    const state = get();
    const pid = profileId ?? state.defaultProfileId;
    const profileName = state.profiles.find((p) => p.id === pid)?.name ?? pid;
    const count = (state.counters[pid] ?? 0) + 1;
    const defaultTitle = count === 1 ? profileName : `${profileName} ${count}`;
    const tab: TerminalTab = {
      id: newTabId(),
      profileId: pid,
      defaultTitle,
      title: defaultTitle,
      titleLocked: false,
      status: "starting",
      exitCode: null,
      sessionId: null,
      generation: 0,
    };
    set({
      tabs: [...state.tabs, tab],
      activeId: tab.id,
      counters: { ...state.counters, [pid]: count },
    });
    return tab.id;
  },

  close(id) {
    const { tabs, activeId, renamingId } = get();
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    let nextActive = activeId;
    if (activeId === id) {
      // Ativa a aba que ficou no mesmo lugar, ou a anterior se era a última.
      nextActive = remaining[Math.min(index, remaining.length - 1)]?.id ?? null;
    }
    set({
      tabs: remaining,
      activeId: nextActive,
      renamingId: renamingId === id ? null : renamingId,
    });
  },

  activate(id) {
    if (get().tabs.some((t) => t.id === id)) set({ activeId: id });
  },

  activateIndex(index) {
    const tab = get().tabs[index];
    if (tab) set({ activeId: tab.id });
  },

  activateLast() {
    const { tabs } = get();
    if (tabs.length > 0) set({ activeId: tabs[tabs.length - 1].id });
  },

  activateRelative(delta) {
    const { tabs, activeId } = get();
    if (tabs.length === 0) return;
    const index = tabs.findIndex((t) => t.id === activeId);
    const next = (index + delta + tabs.length) % tabs.length;
    set({ activeId: tabs[next].id });
  },

  move(id, toIndex) {
    const tabs = [...get().tabs];
    const from = tabs.findIndex((t) => t.id === id);
    if (from === -1) return;
    const target = Math.max(0, Math.min(toIndex, tabs.length - 1));
    const [tab] = tabs.splice(from, 1);
    tabs.splice(target, 0, tab);
    set({ tabs });
  },

  moveActive(delta) {
    const { tabs, activeId } = get();
    const index = tabs.findIndex((t) => t.id === activeId);
    if (index === -1) return;
    get().move(tabs[index].id, index + delta);
  },

  startRename(id) {
    set({ renamingId: id });
  },

  rename(id, title) {
    const clean = title.trim().slice(0, MAX_TITLE_LENGTH);
    set((state) => ({
      renamingId: state.renamingId === id ? null : state.renamingId,
      tabs: updateTab(state.tabs, id, (tab) =>
        clean === ""
          ? { title: tab.defaultTitle, titleLocked: false }
          : { title: clean, titleLocked: true },
      ),
    }));
  },

  setShellTitle(id, title) {
    const clean = title.trim().slice(0, MAX_TITLE_LENGTH);
    if (clean === "") return;
    set((state) => ({
      tabs: updateTab(state.tabs, id, (tab) => (tab.titleLocked ? {} : { title: clean })),
    }));
  },

  setRunning(id, sessionId) {
    set((state) => ({
      tabs: updateTab(state.tabs, id, () => ({ status: "running", sessionId, exitCode: null })),
    }));
  },

  setExited(id, exitCode) {
    set((state) => ({
      tabs: updateTab(state.tabs, id, () => ({ status: "exited", sessionId: null, exitCode })),
    }));
  },

  restart(id) {
    set((state) => ({
      tabs: updateTab(state.tabs, id, (tab) => ({
        status: "starting",
        exitCode: null,
        sessionId: null,
        generation: tab.generation + 1,
        title: tab.titleLocked ? tab.title : tab.defaultTitle,
      })),
    }));
  },
}));
