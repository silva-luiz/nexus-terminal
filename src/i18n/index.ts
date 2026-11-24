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

/** Idiomas oferecidos nas configurações, com o nome no próprio idioma. */
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en-US", label: "English (US)" },
  { code: "es-ES", label: "Español" },
];

/** "system" segue o idioma do Windows; senão usa o escolhido. */
export function resolveLanguage(setting: Language | "system"): Language {
  return setting === "system" ? detectLanguage() : setting;
}

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
