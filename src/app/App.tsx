import { useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";
import { TabBar } from "../components/tabs/TabBar";
import { Sidebar } from "../components/tabs/Sidebar";
import { TitleBar } from "../components/chrome/TitleBar";
import { gridRects } from "../layout/grid";
import { useLayout } from "../layout/useLayout";
import { useShortcutLabel } from "../keybindings/bindings";
import { TerminalView } from "../components/terminal/TerminalView";
import { SearchBar } from "../components/terminal/SearchBar";
import { watchWindowClose } from "../lib/closeTabs";
import { appApi } from "../lib/ipc";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useGlobalShortcuts } from "../keybindings/useGlobalShortcuts";
import { useSessions } from "../stores/sessions";
import { useSettings } from "../stores/settings";
import { useUi } from "../stores/ui";
import { useThemes } from "../stores/themes";
import { startSettingsSync } from "./settingsSync";

export default function App() {
  const { t } = useTranslation();
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  const newTabShortcut = useShortcutLabel("tab.new");
  const layout = useLayout();
  useGlobalShortcuts();

  const grid = layout.viewMode === "grid";
  // IDs das abas como texto: só recalcula a grade quando abas entram, saem ou mudam de ordem.
  const tabIds = tabs.map((tab) => tab.id).join(",");
  // Posição de cada terminal na grade (a ordem é a das abas).
  const cells = useMemo(
    () => (grid ? gridRects(tabIds ? tabIds.split(",") : [], layout.gridColumns) : null),
    [grid, tabIds, layout.gridColumns],
  );
  const vertical = layout.tabPosition !== "top";

  useEffect(() => {
    const stopSync = startSettingsSync();
    const stopClose = watchWindowClose();
    // Segunda instância (o app foi aberto de novo): abre uma aba nesta janela.
    const stopOpenTab = listen<{ cwd: string | null }>("open-tab", (event) => {
      useSessions.getState().create(undefined, event.payload.cwd ?? undefined);
    });
    void useThemes
      .getState()
      .load()
      .catch(() => {});
    const startDir = appApi.startDir().catch(() => null);
    useSettings
      .getState()
      .load()
      .then(async () => {
        useSessions.getState().ensureOne((await startDir) ?? undefined);
        // Arquivo de configurações inválido: abre a tela para mostrar o aviso.
        if (useSettings.getState().warning) useUi.getState().openSettings();
      })
      .catch(() => useSessions.getState().ensureOne());
    return () => {
      stopSync();
      stopClose();
      void stopOpenTab.then((unlisten) => unlisten());
    };
  }, []);

  const terminalArea = (
    <main className={`terminal-area${grid ? " terminal-area--grid" : ""}`}>
      {tabs.map((tab) => (
        <TerminalView
          key={tab.id}
          tab={tab}
          focused={tab.id === activeId}
          visible={grid || tab.id === activeId}
          cell={cells?.get(tab.id) ?? null}
        />
      ))}
      <SearchBar />
      {tabs.length === 0 && (
        <div className="empty-state">
          <p>{t("tabs.empty")}</p>
          <p className="empty-state__hint">
            {t("tabs.emptyHint", { shortcut: newTabShortcut ?? "+" })}
          </p>
        </div>
      )}
    </main>
  );

  return (
    <div className="app">
      {vertical ? (
        <>
          <TitleBar />
          <div className={`workspace workspace--${layout.tabPosition}`}>
            <Sidebar
              side={layout.tabPosition === "right" ? "right" : "left"}
              width={layout.sidebarWidth}
            />
            {terminalArea}
          </div>
        </>
      ) : (
        <>
          <TabBar />
          {terminalArea}
        </>
      )}
      <SettingsDialog />
      <ConfirmDialog />
    </div>
  );
}
