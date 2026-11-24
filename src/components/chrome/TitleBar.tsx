import { useSessions } from "../../stores/sessions";
import { GridToggleButton, SettingsButton } from "./ToolbarButtons";
import { WindowControls } from "./WindowControls";

/** Barra de título fina, usada quando as abas ficam na lateral. */
export function TitleBar() {
  const activeTitle = useSessions((s) => s.tabs.find((t) => t.id === s.activeId)?.title);

  return (
    <header className="title-bar" data-tauri-drag-region>
      <img
        className="title-bar__logo"
        src="/logo.svg"
        alt=""
        width={16}
        height={16}
        data-tauri-drag-region
      />
      <span className="title-bar__title" data-tauri-drag-region>
        {activeTitle ? `${activeTitle} — Nexus Terminal` : "Nexus Terminal"}
      </span>
      <div className="toolbar-group">
        <GridToggleButton />
        <SettingsButton />
      </div>
      <WindowControls />
    </header>
  );
}
