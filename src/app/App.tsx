import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TabBar, formatShortcut } from "../components/tabs/TabBar";
import { TerminalView } from "../components/terminal/TerminalView";
import { useGlobalShortcuts } from "../keybindings/useGlobalShortcuts";
import { shells } from "../lib/ipc";
import { useSessions } from "../stores/sessions";

export default function App() {
  const { t } = useTranslation();
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  useGlobalShortcuts();

  useEffect(() => {
    const { setProfiles, ensureOne } = useSessions.getState();
    shells
      .list()
      .then(setProfiles)
      .catch(() => {})
      .finally(ensureOne);
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
    </div>
  );
}
