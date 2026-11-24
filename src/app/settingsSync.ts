import i18n, { resolveLanguage } from "../i18n";
import { useKeybindings } from "../keybindings/bindings";
import { buildFontStack, setTerminalVisualOptions } from "../lib/terminals";
import { readAppearance, readKeybindings, readLanguage, readTheme } from "../settings/defaults";
import { visibleProfiles } from "../settings/profiles";
import { useSessions } from "../stores/sessions";
import { useSettings } from "../stores/settings";
import { allThemes, useThemes, watchSystemTheme } from "../stores/themes";
import { applyUiTheme, terminalTheme } from "../themes/apply";
import { resolveTheme } from "../themes/resolve";

/** Aplica no app tudo o que vem das configurações: perfis, tema, aparência, idioma e atalhos. */
function applySettings(): void {
  const settings = useSettings.getState().settings;
  const { userThemes, systemDark } = useThemes.getState();

  if (settings) {
    useSessions.getState().setProfiles(
      visibleProfiles(settings).map(({ id, name }) => ({ id, name })),
      settings.general.defaultProfile,
    );
  }

  const theme = resolveTheme(readTheme(settings), allThemes(userThemes), systemDark);
  applyUiTheme(theme);
  const appearance = readAppearance(settings);
  setTerminalVisualOptions({
    theme: terminalTheme(theme),
    fontFamily: buildFontStack(appearance.fontFamily),
    fontSize: appearance.fontSize,
    lineHeight: appearance.lineHeight,
    cursorStyle: appearance.cursorStyle,
    cursorBlink: appearance.cursorBlink,
  });

  const language = resolveLanguage(readLanguage(settings));
  if (i18n.language !== language) void i18n.changeLanguage(language);
  document.documentElement.lang = language;

  useKeybindings.getState().setOverrides(readKeybindings(settings));
}

/** Começa a acompanhar mudanças nas configurações, nos temas e no modo do Windows. */
export function startSettingsSync(): () => void {
  applySettings();
  const stopSettings = useSettings.subscribe((state, previous) => {
    if (state.settings !== previous.settings) applySettings();
  });
  const stopThemes = useThemes.subscribe(applySettings);
  const stopSystem = watchSystemTheme();
  return () => {
    stopSettings();
    stopThemes();
    stopSystem();
  };
}
