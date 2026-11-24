import { useCallback, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSessions, type TerminalTab } from "../../stores/sessions";
import { shortcutLabel, useShortcutLabel } from "../../keybindings/bindings";
import { ContextMenu, type MenuEntry } from "../ui/ContextMenu";
import { Tab } from "./Tab";
import { requestCloseOthers, requestCloseTab, requestCloseToRight } from "../../lib/closeTabs";
import { useUi } from "../../stores/ui";

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
    <header className="tab-bar">
      <div className="tab-bar__tabs" role="tablist">
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
      <div className="tab-bar__spacer" />
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
      {menu && <ContextMenu {...menu} onClose={closeMenu} />}
    </header>
  );
}
