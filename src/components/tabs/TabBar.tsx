import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSessions, type TerminalTab } from "../../stores/sessions";
import { shortcutLabel, useShortcutLabel } from "../../keybindings/bindings";
import { ContextMenu, type MenuEntry } from "../ui/ContextMenu";
import { Tab } from "./Tab";
import { requestCloseOthers, requestCloseTab, requestCloseToRight } from "../../lib/closeTabs";
import { useUi } from "../../stores/ui";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  watchMaximized,
} from "../../lib/window";

interface MenuState {
  x: number;
  y: number;
  items: MenuEntry[];
}

/** "Nova aba (Ctrl+Shift+T)", ou só o texto quando a ação está sem atalho. */
export function withShortcut(label: string, shortcut: string | undefined): string {
  return shortcut ? `${label} (${shortcut})` : label;
}

export function TabBar() {
  const { t } = useTranslation();
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  const profiles = useSessions((s) => s.profiles);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const newTabShortcut = useShortcutLabel("tab.new");
  const settingsShortcut = useShortcutLabel("app.settings");
  const closeMenu = useCallback(() => setMenu(null), []);

  const openTabMenu = (event: MouseEvent, tab: TerminalTab) => {
    const s = useSessions.getState();
    const index = s.tabs.findIndex((x) => x.id === tab.id);
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: t("tabs.rename"),
          hint: shortcutLabel("tab.rename"),
          onSelect: () => s.startRename(tab.id),
        },
        { label: t("tabs.restart"), onSelect: () => s.restart(tab.id) },
        "separator",
        {
          label: t("tabs.close"),
          hint: shortcutLabel("tab.close"),
          onSelect: () => void requestCloseTab(tab.id),
        },
        {
          label: t("tabs.closeOthers"),
          disabled: s.tabs.length < 2,
          onSelect: () => void requestCloseOthers(tab.id),
        },
        {
          label: t("tabs.closeToRight"),
          disabled: index === s.tabs.length - 1,
          onSelect: () => void requestCloseToRight(tab.id),
        },
      ],
    });
  };

  const openProfileMenu = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({
      x: rect.left,
      y: rect.bottom + 2,
      items: profiles.map((profile, i) => ({
        label: profile.name,
        hint: shortcutLabel(`tab.newWithProfile.${i + 1}`),
        onSelect: () => useSessions.getState().create(profile.id),
      })),
    });
  };

  return (
    // A barra de abas é também a barra de título: áreas vazias arrastam a janela.
    <header className="tab-bar" data-tauri-drag-region>
      <div className="tab-bar__tabs" role="tablist" data-tauri-drag-region>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            tab={tab}
            index={index}
            active={tab.id === activeId}
            onContextMenu={openTabMenu}
          />
        ))}
      </div>
      <div className="tab-bar__actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t("tabs.new")}
          title={withShortcut(t("tabs.new"), newTabShortcut)}
          onClick={() => useSessions.getState().create()}
        >
          +
        </button>
        <button
          type="button"
          className="icon-button icon-button--narrow"
          aria-label={t("tabs.openProfile")}
          title={t("tabs.openProfile")}
          disabled={profiles.length === 0}
          onClick={openProfileMenu}
        >
          ▾
        </button>
      </div>
      <div className="tab-bar__spacer" data-tauri-drag-region />
      <div className="tab-bar__actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t("tabs.settings")}
          title={withShortcut(t("tabs.settings"), settingsShortcut)}
          onClick={() => useUi.getState().openSettings()}
        >
          ⚙
        </button>
      </div>
      <WindowControls />
      {menu && <ContextMenu {...menu} onClose={closeMenu} />}
    </header>
  );
}

/** Minimizar, maximizar/restaurar e fechar (ícones da fonte Segoe Fluent Icons do Windows). */
function WindowControls() {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);
  useEffect(() => watchMaximized(setMaximized), []);

  return (
    <div className="window-controls">
      <button
        type="button"
        className="window-controls__button"
        aria-label={t("window.minimize")}
        title={t("window.minimize")}
        onClick={minimizeWindow}
      >
        {"\uE921"}
      </button>
      <button
        type="button"
        className="window-controls__button"
        aria-label={t(maximized ? "window.restore" : "window.maximize")}
        title={t(maximized ? "window.restore" : "window.maximize")}
        onClick={toggleMaximizeWindow}
      >
        {maximized ? "\uE923" : "\uE922"}
      </button>
      <button
        type="button"
        className="window-controls__button window-controls__button--close"
        aria-label={t("window.close")}
        title={t("window.close")}
        onClick={closeWindow}
      >
        {"\uE8BB"}
      </button>
    </div>
  );
}
