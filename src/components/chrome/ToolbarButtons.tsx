import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useShortcutLabel } from "../../keybindings/bindings";
import { toggleViewMode, useLayout } from "../../layout/useLayout";
import { useSessions } from "../../stores/sessions";
import { useUi } from "../../stores/ui";

/** "Nova aba (Ctrl+Shift+T)", ou só o texto quando a ação está sem atalho. */
export function withShortcut(label: string, shortcut: string | undefined): string {
  return shortcut ? `${label} (${shortcut})` : label;
}

/** Botão dividido: "+" abre o shell padrão; a seta abre a lista de shells para escolher. */
export function NewTabButtons({
  onProfileMenu,
}: {
  onProfileMenu(event: MouseEvent<HTMLButtonElement>): void;
}) {
  const { t } = useTranslation();
  const shortcut = useShortcutLabel("tab.new");
  const hasProfiles = useSessions((s) => s.profiles.length > 0);
  return (
    <div className="split-button" role="group" aria-label={t("tabs.new")}>
      <button
        type="button"
        className="split-button__main"
        aria-label={t("tabs.new")}
        title={withShortcut(t("tabs.new"), shortcut)}
        onClick={() => useSessions.getState().create()}
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        className="split-button__menu"
        aria-label={t("tabs.openProfile")}
        aria-haspopup="menu"
        title={t("tabs.openProfile")}
        disabled={!hasProfiles}
        onClick={onProfileMenu}
      >
        <ChevronIcon />
      </button>
    </div>
  );
}

/** Alterna entre ver um terminal por vez (abas) e todos lado a lado (grade). */
export function GridToggleButton() {
  const { t } = useTranslation();
  const { viewMode } = useLayout();
  const shortcut = useShortcutLabel("app.toggleGrid");
  const grid = viewMode === "grid";
  const label = t(grid ? "layout.showTabs" : "layout.showGrid");
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      aria-pressed={grid}
      title={withShortcut(label, shortcut)}
      onClick={toggleViewMode}
    >
      {grid ? <SingleIcon /> : <GridIcon />}
    </button>
  );
}

export function SettingsButton() {
  const { t } = useTranslation();
  const shortcut = useShortcutLabel("app.settings");
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={t("tabs.settings")}
      title={withShortcut(t("tabs.settings"), shortcut)}
      onClick={() => useUi.getState().openSettings()}
    >
      ⚙
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="none" stroke="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1" fill="none" stroke="currentColor" />
      <rect x="1" y="8" width="5" height="5" rx="1" fill="none" stroke="currentColor" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="none" stroke="currentColor" />
    </svg>
  );
}

function SingleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="1" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" />
      <line x1="1" y1="4" x2="13" y2="4" stroke="currentColor" />
    </svg>
  );
}
