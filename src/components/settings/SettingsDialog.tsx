import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../stores/settings";
import { useUi } from "../../stores/ui";
import { focusActiveTerminal } from "../../lib/terminals";
import { Modal } from "../ui/Modal";
import { GeneralSection } from "./GeneralSection";
import { ShellsSection } from "./ShellsSection";

type Section = "general" | "shells";
const SECTIONS: Section[] = ["general", "shells"];

export function SettingsDialog() {
  const { t } = useTranslation();
  const open = useUi((s) => s.settingsOpen);
  const settings = useSettings((s) => s.settings);
  const warning = useSettings((s) => s.warning);
  const error = useSettings((s) => s.error);
  const [section, setSection] = useState<Section>("general");

  if (!open) return null;

  const close = () => {
    useUi.getState().closeSettings();
    focusActiveTerminal();
  };

  return (
    <Modal title={t("settings.title")} onClose={close} className="modal--settings">
      <nav className="settings-nav" aria-label={t("settings.title")}>
        <h2 className="settings-nav__title">{t("settings.title")}</h2>
        {SECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            className={`settings-nav__item${section === id ? " is-active" : ""}`}
            aria-current={section === id ? "page" : undefined}
            onClick={() => setSection(id)}
          >
            {t(`settings.nav.${id}`)}
          </button>
        ))}
      </nav>

      <section className="settings-content">
        <header className="settings-content__header">
          <h3>{t(`settings.nav.${section}`)}</h3>
          <button
            type="button"
            className="icon-button"
            aria-label={t("settings.close")}
            title={t("settings.close")}
            onClick={close}
          >
            ×
          </button>
        </header>

        {warning && (
          <Banner
            kind="warning"
            text={t("settings.warning")}
            detail={warning}
            onDismiss={() => useSettings.getState().dismissWarning()}
            dismissLabel={t("settings.dismiss")}
          />
        )}
        {error && (
          <Banner
            kind="error"
            text={t("settings.saveError", { error })}
            onDismiss={() => useSettings.getState().dismissError()}
            dismissLabel={t("settings.dismiss")}
          />
        )}

        {settings && section === "general" && <GeneralSection settings={settings} />}
        {settings && section === "shells" && <ShellsSection settings={settings} />}
      </section>
    </Modal>
  );
}

function Banner(props: {
  kind: "warning" | "error";
  text: string;
  detail?: string;
  dismissLabel: string;
  onDismiss(): void;
}) {
  return (
    <div className={`banner banner--${props.kind}`} role="alert">
      <div>
        <p>{props.text}</p>
        {props.detail && <code>{props.detail}</code>}
      </div>
      <button type="button" className="button button--small" onClick={props.onDismiss}>
        {props.dismissLabel}
      </button>
    </div>
  );
}
