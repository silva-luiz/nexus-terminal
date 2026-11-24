import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TabBar } from "../components/tabs/TabBar";
import { useShortcutLabel } from "../keybindings/bindings";
import { TerminalView } from "../components/terminal/TerminalView";
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
  useGlobalShortcuts();

  useEffect(() => {
    const stopSync = startSettingsSync();
    void useThemes
      .getState()
      .load()
      .catch(() => {});
    useSettings
      .getState()
      .load()
      .then(() => {
        useSessions.getState().ensureOne();
        // Arquivo de configurações inválido: abre a tela para mostrar o aviso.
        if (useSettings.getState().warning) useUi.getState().openSettings();
      })
      .catch(() => useSessions.getState().ensureOne());
    return stopSync;
  }, []);

  return (
    <div className="app">
      <TabBar />
      <main className="terminal-area">
        {tabs.map((tab) => (
          <TerminalView key={tab.id} tab={tab} active={tab.id === activeId} />
        ))}
        {tabs.length === 0 && (
          <div className="empty-state">
            <p>{t("tabs.empty")}</p>
            <p className="empty-state__hint">
              {t("tabs.emptyHint", { shortcut: newTabShortcut ?? "+" })}
            </p>
          </div>
        )}
      </main>
      <SettingsDialog />
      <ConfirmDialog />
    </div>
  );
}
