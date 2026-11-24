import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";

export const resources = {
  "pt-BR": { translation: ptBR },
  "en-US": { translation: enUS },
  "es-ES": { translation: esES },
} as const;

export type Language = keyof typeof resources;

/** Na Fase 4 o idioma passa a vir do settings.json. */
export function detectLanguage(browserLanguage: string = navigator.language): Language {
  const lang = browserLanguage.toLowerCase();
  if (lang.startsWith("pt")) return "pt-BR";
  if (lang.startsWith("es")) return "es-ES";
  return "en-US";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});

export default i18n;
