import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";

const STACK = ["Tauri 2", "React", "xterm.js", "ConPTY (portable-pty)"];
const THEME_CREDITS = [
  "Dracula — draculatheme.com",
  "One Half — Son A. Pham",
  "Solarized — Ethan Schoonover",
  "Nord — Arctic Ice Studio",
];

export function AboutSection() {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  return (
    <div className="settings-form about">
      <div className="about__header">
        <img className="about__logo" src="/logo.svg" alt="" width={56} height={56} />
        <div>
          <h4 className="about__name">Nexus Terminal</h4>
          <p className="field__hint">{version ? t("settings.about.version", { version }) : "…"}</p>
        </div>
      </div>
      <p>{t("settings.about.description")}</p>

      <h4 className="settings-form__title">{t("settings.about.builtWith")}</h4>
      <p className="field__hint">{STACK.join(" · ")}</p>

      <h4 className="settings-form__title">{t("settings.about.themeCredits")}</h4>
      <ul className="about__list">
        {THEME_CREDITS.map((credit) => (
          <li key={credit}>{credit}</li>
        ))}
      </ul>
      <p className="field__hint">{t("settings.about.licensesHint")}</p>
    </div>
  );
}
