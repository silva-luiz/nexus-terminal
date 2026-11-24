import type { Profile, Settings } from "../lib/types";

/** Funções puras para editar perfis. A tela de configurações só usa estas funções. */

export function visibleProfiles(settings: Settings): Profile[] {
  return settings.profiles.filter((p) => !p.hidden);
}

export function setDefaultProfile(settings: Settings, id: string): Settings {
  return { ...settings, general: { ...settings.general, defaultProfile: id } };
}

export function upsertProfile(settings: Settings, profile: Profile): Settings {
  const exists = settings.profiles.some((p) => p.id === profile.id);
  return {
    ...settings,
    profiles: exists
      ? settings.profiles.map((p) => (p.id === profile.id ? profile : p))
      : [...settings.profiles, profile],
  };
}

export function removeProfile(settings: Settings, id: string): Settings {
  return { ...settings, profiles: settings.profiles.filter((p) => p.id !== id) };
}

export function toggleHidden(settings: Settings, id: string): Settings {
  return {
    ...settings,
    profiles: settings.profiles.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p)),
  };
}

export function moveProfile(settings: Settings, id: string, delta: number): Settings {
  const profiles = [...settings.profiles];
  const from = profiles.findIndex((p) => p.id === id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= profiles.length) return settings;
  const [profile] = profiles.splice(from, 1);
  profiles.splice(to, 0, profile);
  return { ...settings, profiles };
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function newProfileId(name: string, existing: Profile[]): string {
  const base = slugify(name) || "perfil";
  const ids = new Set(existing.map((p) => p.id));
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
  return id;
}

export function duplicateProfile(settings: Settings, id: string, suffix: string): Settings {
  const index = settings.profiles.findIndex((p) => p.id === id);
  if (index === -1) return settings;
  const original = settings.profiles[index];
  const name = `${original.name} ${suffix}`;
  const copy: Profile = {
    ...original,
    env: { ...original.env },
    args: [...original.args],
    id: newProfileId(name, settings.profiles),
    name,
    hidden: false,
    source: "custom",
  };
  const profiles = [...settings.profiles];
  profiles.splice(index + 1, 0, copy);
  return { ...settings, profiles };
}

export function emptyProfile(): Profile {
  return {
    id: "",
    name: "",
    icon: "terminal",
    command: "",
    args: [],
    env: {},
    hidden: false,
    source: "custom",
  };
}

/** `--login -i "C:\Minha Pasta"` → ["--login", "-i", "C:\Minha Pasta"] */
export function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let quoted = false;
  let hasToken = false;
  for (const ch of input) {
    if (ch === '"') {
      quoted = !quoted;
      hasToken = true;
    } else if (/\s/.test(ch) && !quoted) {
      if (hasToken) args.push(current);
      current = "";
      hasToken = false;
    } else {
      current += ch;
      hasToken = true;
    }
  }
  if (hasToken) args.push(current);
  return args;
}

export function formatArgs(args: string[]): string {
  return args.map((a) => (a === "" || /\s/.test(a) ? `"${a}"` : a)).join(" ");
}

/** Uma variável por linha: `NOME=valor`. Linhas sem nome válido são ignoradas. */
export function parseEnv(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (key) env[key] = line.slice(eq + 1);
  }
  return env;
}

export function formatEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}
