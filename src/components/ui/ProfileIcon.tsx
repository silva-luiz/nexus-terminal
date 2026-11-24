import type { ProfileIconName } from "../../lib/types";

export const PROFILE_ICONS: ProfileIconName[] = ["powershell", "cmd", "git", "linux", "terminal"];

const GLYPHS: Record<ProfileIconName, string> = {
  powershell: "PS",
  cmd: "C:",
  git: "git",
  linux: "λ",
  terminal: ">_",
};

/** Selo pequeno que identifica o tipo de shell. */
export function ProfileIcon({ icon, label }: { icon: string; label?: string }) {
  const name = (PROFILE_ICONS as string[]).includes(icon) ? (icon as ProfileIconName) : "terminal";
  return (
    <span className={`profile-icon profile-icon--${name}`} aria-label={label} aria-hidden={!label}>
      {GLYPHS[name]}
    </span>
  );
}
