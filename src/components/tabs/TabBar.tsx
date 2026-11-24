import { useSessions } from "../../stores/sessions";
import { GridToggleButton, NewTabButtons, SettingsButton } from "../chrome/ToolbarButtons";
import { useTabMenus } from "../chrome/useTabMenus";
import { WindowControls } from "../chrome/WindowControls";
import { Tab } from "./Tab";

/** Abas em cima: a barra de abas é também a barra de título (áreas vazias arrastam a janela). */
export function TabBar() {
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  const { menu, openTabMenu, openProfileMenu } = useTabMenus("horizontal");

  return (
    <header className="tab-bar" data-tauri-drag-region>
      <div className="tab-bar__tabs" role="tablist" data-tauri-drag-region>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            tab={tab}
            index={index}
            active={tab.id === activeId}
            orientation="horizontal"
            onContextMenu={openTabMenu}
          />
        ))}
      </div>
      <NewTabButtons onProfileMenu={openProfileMenu} />
      <div className="tab-bar__spacer" data-tauri-drag-region />
      <div className="toolbar-group">
        <GridToggleButton />
        <SettingsButton />
      </div>
      <WindowControls />
      {menu}
    </header>
  );
}
