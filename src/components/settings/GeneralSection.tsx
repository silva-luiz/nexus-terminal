import { useTranslation } from "react-i18next";
import type { Settings } from "../../lib/types";
import { readClipboard, type ClipboardSettings } from "../../settings/defaults";
import { setDefaultProfile, visibleProfiles } from "../../settings/profiles";
import { useSettings } from "../../stores/settings";
import { CheckboxField } from "./CheckboxField";

const CLIPBOARD_OPTIONS: (keyof ClipboardSettings)[] = [
  "ctrlCCopiesSelection",
  "copyOnSelect",
  "rightClickPaste",
  "confirmMultilinePaste",
];

export function GeneralSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const profiles = visibleProfiles(settings);
  const clipboard = readClipboard(settings);

  const setGeneral = (patch: Partial<Settings["general"]>) =>
    void update((s) => ({ ...s, general: { ...s.general, ...patch } }));

  return (
    <div className="settings-form">
      <div className="field">
        <label htmlFor="default-profile">{t("settings.general.defaultProfile")}</label>
        <select
          id="default-profile"
          value={settings.general.defaultProfile}
          onChange={(event) => void update((s) => setDefaultProfile(s, event.target.value))}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="field__hint">{t("settings.general.defaultProfileHint")}</p>
      </div>

      <CheckboxField
        id="confirm-close"
        label={t("settings.general.confirmCloseRunning")}
        hint={t("settings.general.confirmCloseRunningHint")}
        checked={settings.general.confirmCloseRunning}
        onChange={(confirmCloseRunning) => setGeneral({ confirmCloseRunning })}
      />

      <h4 className="settings-form__title">{t("settings.general.clipboard")}</h4>
      {CLIPBOARD_OPTIONS.map((key) => (
        <CheckboxField
          key={key}
          id={`clipboard-${key}`}
          label={t(`settings.general.${key}`)}
          hint={t(`settings.general.${key}Hint`)}
          checked={clipboard[key]}
          onChange={(checked) => setGeneral({ [key]: checked })}
        />
      ))}
    </div>
  );
}
