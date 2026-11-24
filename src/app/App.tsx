import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TabBar, formatShortcut } from "../components/tabs/TabBar";
import { TerminalView } from "../components/terminal/TerminalView";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useGlobalShortcuts } from "../keybindings/useGlobalShortcuts";
import { visibleProfiles } from "../settings/profiles";
import { useSessions } from "../stores/sessions";
import { useSettings } from "../stores/settings";
import { useUi } from "../stores/ui";

/** Mantém a lista de perfis das abas igual à das configurações. */
function syncProfiles(): void {
  const settings = useSettings.getState().settings;
  if (!settings) return;
  useSessions.getState().setProfiles(
    visibleProfiles(settings).map(({ id, name }) => ({ id, name })),
    settings.general.defaultProfile,
  );
}

export default function App() {
  const { t } = useTranslation();
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  useGlobalShortcuts();

  useEffect(() => {
    const unsubscribe = useSettings.subscribe((state, previous) => {
      if (state.settings !== previous.settings) syncProfiles();
    });
    useSettings
      .getState()
      .load()
      .then(() => {
        syncProfiles();
        useSessions.getState().ensureOne();
        // Arquivo de configurações inválido: abre a tela para mostrar o aviso.
        if (useSettings.getState().warning) useUi.getState().openSettings();
      })
      .catch(() => useSessions.getState().ensureOne());
    return unsubscribe;
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
              {t("tabs.emptyHint", { shortcut: formatShortcut("tab.new") })}
            </p>
          </div>
        )}
      </main>
      <SettingsDialog />
      <ConfirmDialog />
    </div>
  );
}
