import { useState } from "react";
import { useTranslation } from "react-i18next";
import { appApi } from "../../lib/ipc";
import type { Settings, TerminalSettings } from "../../lib/types";
import { readTerminal } from "../../settings/defaults";
import { useSettings } from "../../stores/settings";
import { CheckboxField } from "./CheckboxField";

const SCROLLBACK_OPTIONS = [1_000, 5_000, 10_000, 20_000, 50_000, 100_000];

export function AdvancedSection({ settings }: { settings: Settings }) {
  const { t, i18n } = useTranslation();
  const update = useSettings((s) => s.update);
  const terminal = readTerminal(settings);
  const [error, setError] = useState<string | null>(null);
  const format = new Intl.NumberFormat(i18n.language);

  const setTerminal = (patch: Partial<TerminalSettings>) =>
    void update((s) => ({ ...s, terminal: { ...readTerminal(s), ...patch } }));

  const openFolder = (folder: "config" | "logs") => {
    setError(null);
    appApi.openFolder(folder).catch((err) => setError(String(err)));
  };

  return (
    <div className="settings-form">
      <div className="field-grid field-grid--2">
        <div className="field">
          <label htmlFor="scrollback">{t("settings.advanced.scrollback")}</label>
          <select
            id="scrollback"
            value={terminal.scrollback}
            onChange={(e) => setTerminal({ scrollback: Number(e.target.value) })}
          >
            {SCROLLBACK_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {t("settings.advanced.lines", { count: n, formatted: format.format(n) })}
              </option>
            ))}
          </select>
          <p className="field__hint">{t("settings.advanced.scrollbackHint")}</p>
        </div>
        <div className="field">
          <label htmlFor="renderer">{t("settings.advanced.renderer")}</label>
          <select
            id="renderer"
            value={terminal.renderer}
            onChange={(e) =>
              setTerminal({ renderer: e.target.value as TerminalSettings["renderer"] })
            }
          >
            <option value="webgl">{t("settings.advanced.renderer_webgl")}</option>
            <option value="dom">{t("settings.advanced.renderer_dom")}</option>
          </select>
          <p className="field__hint">{t("settings.advanced.rendererHint")}</p>
        </div>
      </div>

      <CheckboxField
        id="screen-reader"
        label={t("settings.advanced.screenReader")}
        hint={t("settings.advanced.screenReaderHint")}
        checked={terminal.screenReaderMode}
        onChange={(screenReaderMode) => setTerminal({ screenReaderMode })}
      />

      <h4 className="settings-form__title">{t("settings.advanced.folders")}</h4>
      <div className="shells__toolbar">
        <button type="button" className="button" onClick={() => openFolder("config")}>
          {t("settings.advanced.openConfig")}
        </button>
        <button type="button" className="button" onClick={() => openFolder("logs")}>
          {t("settings.advanced.openLogs")}
        </button>
      </div>
      <p className="field__hint">{t("settings.advanced.foldersHint")}</p>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
