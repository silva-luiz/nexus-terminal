import i18n, { resolveLanguage } from "../i18n";
import { useKeybindings } from "../keybindings/bindings";
import { buildFontStack, setTerminalBehavior, setTerminalVisualOptions } from "../lib/terminals";
import {
  readAppearance,
  readClipboard,
  readKeybindings,
  readLanguage,
  readTerminal,
  readTheme,
} from "../settings/defaults";
import { visibleProfiles } from "../settings/profiles";
import { useSessions } from "../stores/sessions";
import { useSettings } from "../stores/settings";
import { allThemes, useThemes } from "../stores/themes";
import { applyUiTheme, terminalTheme } from "../themes/apply";
import { resolveTheme } from "../themes/resolve";

/** Aplica no app tudo o que vem das configurações: perfis, tema, aparência, idioma e atalhos. */
function applySettings(): void {
  const settings = useSettings.getState().settings;
  const { userThemes } = useThemes.getState();

  if (settings) {
    useSessions.getState().setProfiles(
      visibleProfiles(settings).map(({ id, name }) => ({ id, name })),
      settings.general.defaultProfile,
    );
  }

  const theme = resolveTheme(readTheme(settings), allThemes(userThemes));
  applyUiTheme(theme);
  const appearance = readAppearance(settings);
  const terminal = readTerminal(settings);
  setTerminalBehavior({ ...readClipboard(settings), renderer: terminal.renderer });
  setTerminalVisualOptions({
    scrollback: terminal.scrollback,
    screenReaderMode: terminal.screenReaderMode,
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

/** Começa a acompanhar mudanças nas configurações e nos temas. */
export function startSettingsSync(): () => void {
  applySettings();
  const stopSettings = useSettings.subscribe((state, previous) => {
    if (state.settings !== previous.settings) applySettings();
  });
  const stopThemes = useThemes.subscribe(applySettings);
  return () => {
    stopSettings();
    stopThemes();
  };
}
