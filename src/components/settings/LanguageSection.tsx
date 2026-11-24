import { useTranslation } from "react-i18next";
import { LANGUAGES, detectLanguage } from "../../i18n";
import type { LanguageSetting, Settings } from "../../lib/types";
import { readLanguage } from "../../settings/defaults";
import { useSettings } from "../../stores/settings";

export function LanguageSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const current = readLanguage(settings);
  const systemLabel = LANGUAGES.find((l) => l.code === detectLanguage())?.label ?? "";

  const options: { value: LanguageSetting; label: string }[] = [
    { value: "system", label: t("settings.language.system", { language: systemLabel }) },
    ...LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
  ];

  return (
    <div className="settings-form">
      <fieldset className="field">
        <legend>{t("settings.language.label")}</legend>
        <div className="radio-list">
          {options.map((option) => (
            <label key={option.value} className="radio-list__item">
              <input
                type="radio"
                name="language"
                value={option.value}
                checked={current === option.value}
                onChange={() => void update((s) => ({ ...s, language: option.value }))}
              />
              <span lang={option.value === "system" ? undefined : option.value}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <p className="field__hint">{t("settings.language.note")}</p>
      </fieldset>
    </div>
  );
}
