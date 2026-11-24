import { useTranslation } from "react-i18next";
import { useShortcutLabel } from "../../keybindings/bindings";
import { gridColumns } from "../../layout/grid";
import { updateLayout, useLayout } from "../../layout/useLayout";
import type { LayoutSettings, TabPosition, ViewMode } from "../../lib/types";
import { useSessions } from "../../stores/sessions";

const POSITIONS: TabPosition[] = ["top", "left", "right"];
const VIEW_MODES: ViewMode[] = ["tabs", "grid"];
const COLUMNS: LayoutSettings["gridColumns"][] = ["auto", 1, 2, 3, 4];

export function LayoutSection() {
  const { t } = useTranslation();
  const layout = useLayout();
  const openTabs = useSessions((s) => s.tabs.length);
  const gridShortcut = useShortcutLabel("app.toggleGrid");
  const cols = gridColumns(openTabs, layout.gridColumns);

  return (
    <div className="settings-form">
      <fieldset className="field">
        <legend>{t("settings.layout.tabPosition")}</legend>
        <div className="layout-options">
          {POSITIONS.map((position) => (
            <button
              key={position}
              type="button"
              className="layout-option"
              aria-pressed={layout.tabPosition === position}
              onClick={() => updateLayout({ tabPosition: position })}
            >
              <PositionPreview position={position} />
              <span>{t(`settings.layout.position_${position}`)}</span>
            </button>
          ))}
        </div>
        <p className="field__hint">{t("settings.layout.tabPositionHint")}</p>
      </fieldset>

      <fieldset className="field">
        <legend>{t("settings.layout.viewMode")}</legend>
        <div className="segmented">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className="segmented__item"
              aria-pressed={layout.viewMode === mode}
              onClick={() => updateLayout({ viewMode: mode })}
            >
              {t(`settings.layout.view_${mode}`)}
            </button>
          ))}
        </div>
        <p className="field__hint">
          {t("settings.layout.viewModeHint", { shortcut: gridShortcut ?? "—" })}
        </p>
      </fieldset>

      <div className="field">
        <label htmlFor="grid-columns">{t("settings.layout.gridColumns")}</label>
        <select
          id="grid-columns"
          value={String(layout.gridColumns)}
          onChange={(e) =>
            updateLayout({
              gridColumns:
                e.target.value === "auto"
                  ? "auto"
                  : (Number(e.target.value) as LayoutSettings["gridColumns"]),
            })
          }
        >
          {COLUMNS.map((c) => (
            <option key={c} value={String(c)}>
              {c === "auto" ? t("settings.layout.columnsAuto") : c}
            </option>
          ))}
        </select>
        <p className="field__hint">
          {openTabs > 0
            ? t("settings.layout.gridPreview", {
                count: openTabs,
                cols,
                rows: Math.ceil(openTabs / cols),
              })
            : t("settings.layout.gridColumnsHint")}
        </p>
      </div>
    </div>
  );
}

/** Desenho pequeno da janela com as abas na posição indicada. */
function PositionPreview({ position }: { position: TabPosition }) {
  return (
    <svg className="layout-option__preview" viewBox="0 0 64 40" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="39" rx="3" className="preview-frame" />
      {position === "top" && <rect x="1" y="1" width="62" height="8" className="preview-tabs" />}
      {position === "left" && <rect x="1" y="1" width="16" height="38" className="preview-tabs" />}
      {position === "right" && (
        <rect x="47" y="1" width="16" height="38" className="preview-tabs" />
      )}
    </svg>
  );
}
