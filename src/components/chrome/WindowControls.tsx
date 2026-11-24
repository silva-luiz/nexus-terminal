import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  watchMaximized,
} from "../../lib/window";

/** Minimizar, maximizar/restaurar e fechar (ícones da fonte Segoe Fluent Icons do Windows). */
export function WindowControls() {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);
  useEffect(() => watchMaximized(setMaximized), []);

  return (
    <div className="window-controls">
      <button
        type="button"
        className="window-controls__button"
        aria-label={t("window.minimize")}
        title={t("window.minimize")}
        onClick={minimizeWindow}
      >
        {""}
      </button>
      <button
        type="button"
        className="window-controls__button"
        aria-label={t(maximized ? "window.restore" : "window.maximize")}
        title={t(maximized ? "window.restore" : "window.maximize")}
        onClick={toggleMaximizeWindow}
      >
        {maximized ? "" : ""}
      </button>
      <button
        type="button"
        className="window-controls__button window-controls__button--close"
        aria-label={t("window.close")}
        title={t("window.close")}
        onClick={closeWindow}
      >
        {""}
      </button>
    </div>
  );
}
