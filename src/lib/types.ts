/** Tipos espelhados do backend (src-tauri/src/config e src-tauri/src/shells). */

export type ProfileSource = "detected" | "custom";

export type ProfileIconName = "powershell" | "cmd" | "git" | "linux" | "terminal";

export interface Profile {
  id: string;
  name: string;
  icon: ProfileIconName | string;
  command: string;
  args: string[];
  cwd?: string;
  env: Record<string, string>;
  hidden: boolean;
  source: ProfileSource;
}

export interface GeneralSettings {
  defaultProfile: string;
  confirmCloseRunning: boolean;
  /** Chaves desconhecidas são preservadas pelo backend. */
  [key: string]: unknown;
}

export type ThemeMode = "system" | "dark" | "light";

export interface ThemeSettings {
  mode: ThemeMode;
  /** Tema usado no modo escuro. */
  dark: string;
  /** Tema usado no modo claro. */
  light: string;
}

export type CursorStyle = "bar" | "block" | "underline";

export interface AppearanceSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
}

export type LanguageSetting = "system" | "pt-BR" | "en-US" | "es-ES";

/** Diferença em relação ao atalho padrão. `keys: null` desativa a ação. */
export interface KeybindingOverride {
  action: string;
  keys: string | null;
}

export interface Settings {
  version: number;
  general: GeneralSettings;
  profiles: Profile[];
  /** Campos opcionais: ausentes em arquivos antigos; os padrões ficam em settings/defaults.ts. */
  language?: LanguageSetting;
  theme?: ThemeSettings;
  appearance?: AppearanceSettings;
  keybindings?: KeybindingOverride[];
  [key: string]: unknown;
}

export interface LoadedSettings {
  settings: Settings;
  warning: string | null;
}
