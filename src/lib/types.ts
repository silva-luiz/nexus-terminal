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

export interface Settings {
  version: number;
  general: GeneralSettings;
  profiles: Profile[];
  [key: string]: unknown;
}

export interface LoadedSettings {
  settings: Settings;
  warning: string | null;
}
