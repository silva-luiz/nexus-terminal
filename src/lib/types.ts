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
  /** Opções de copiar/colar (Fase 5). Ausentes em arquivos antigos: ver settings/defaults.ts. */
  copyOnSelect?: boolean;
  rightClickPaste?: boolean;
  ctrlCCopiesSelection?: boolean;
  confirmMultilinePaste?: boolean;
  /** Chaves desconhecidas são preservadas pelo backend. */
  [key: string]: unknown;
}

export interface ThemeSettings {
  /** ID do tema em uso. */
  selected: string;
}

export type CursorStyle = "bar" | "block" | "underline";

export interface AppearanceSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
}

export interface TerminalSettings {
  scrollback: number;
  renderer: "webgl" | "dom";
  screenReaderMode: boolean;
}

export type TabPosition = "top" | "left" | "right";
export type ViewMode = "tabs" | "grid";

export interface LayoutSettings {
  /** Onde ficam as abas: em cima (horizontal) ou numa barra lateral. */
  tabPosition: TabPosition;
  /** "tabs": um terminal por vez; "grid": todos os terminais lado a lado. */
  viewMode: ViewMode;
  /** Máximo de colunas da grade ("auto" = o mais quadrado possível). */
  gridColumns: "auto" | 1 | 2 | 3 | 4;
  /** Largura da barra lateral, em pixels. */
  sidebarWidth: number;
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
  terminal?: TerminalSettings;
  layout?: LayoutSettings;
  [key: string]: unknown;
}

export interface LoadedSettings {
  settings: Settings;
  warning: string | null;
}
