import { useTranslation } from "react-i18next";
import type { Settings } from "../../lib/types";
import { setDefaultProfile, visibleProfiles } from "../../settings/profiles";
import { useSettings } from "../../stores/settings";

export function GeneralSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const profiles = visibleProfiles(settings);

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

      <div className="field field--checkbox">
        <input
          id="confirm-close"
          type="checkbox"
          checked={settings.general.confirmCloseRunning}
          onChange={(event) => {
            const checked = event.target.checked;
            void update((s) => ({ ...s, general: { ...s.general, confirmCloseRunning: checked } }));
          }}
        />
        <div>
          <label htmlFor="confirm-close">{t("settings.general.confirmCloseRunning")}</label>
          <p className="field__hint">{t("settings.general.confirmCloseRunningHint")}</p>
        </div>
      </div>
    </div>
  );
}
