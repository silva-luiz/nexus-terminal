import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";

const STACK = ["Tauri 2", "React", "xterm.js", "ConPTY"];
const THEME_CREDITS: [theme: string, author: string][] = [
  ["Dracula", "draculatheme.com"],
  ["One Half", "Son A. Pham"],
  ["Solarized", "Ethan Schoonover"],
  ["Nord", "Arctic Ice Studio"],
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
    <div className="about">
      <header className="about__hero">
        <img className="about__logo" src="/logo.svg" alt="" width={64} height={64} />
        <div>
          <h3 className="about__name">Nexus Terminal</h3>
          <p className="about__version">
            {version ? t("settings.about.version", { version }) : "…"}
          </p>
        </div>
      </header>

      <p className="about__description">{t("settings.about.description")}</p>

      <section className="about__section">
        <h4 className="about__heading">{t("settings.about.builtWith")}</h4>
        <ul className="chip-list">
          {STACK.map((item) => (
            <li key={item} className="chip">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="about__section">
        <h4 className="about__heading">{t("settings.about.themeCredits")}</h4>
        <dl className="about__credits">
          {THEME_CREDITS.map(([theme, author]) => (
            <div key={theme} className="about__credit">
              <dt>{theme}</dt>
              <dd>{author}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="about__footnote">{t("settings.about.licensesHint")}</p>
    </div>
  );
}
