import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { shells } from "../../lib/ipc";
import type { Profile } from "../../lib/types";
import {
  emptyProfile,
  formatArgs,
  formatEnv,
  newProfileId,
  parseArgs,
  parseEnv,
} from "../../settings/profiles";
import { PROFILE_ICONS, ProfileIcon } from "../ui/ProfileIcon";

interface Props {
  /** null = novo perfil. */
  profile: Profile | null;
  allProfiles: Profile[];
  onSave(profile: Profile): void;
  onCancel(): void;
}

const COMMAND_CHECK_DEBOUNCE_MS = 300;

export function ProfileEditor({ profile, allProfiles, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const base = profile ?? emptyProfile();
  const [name, setName] = useState(base.name);
  const [icon, setIcon] = useState(base.icon);
  const [command, setCommand] = useState(base.command);
  const [argsText, setArgsText] = useState(formatArgs(base.args));
  const [cwd, setCwd] = useState(base.cwd ?? "");
  const [envText, setEnvText] = useState(formatEnv(base.env));
  const [submitted, setSubmitted] = useState(false);
  const [commandFound, setCommandFound] = useState(true);

  useEffect(() => {
    if (!command.trim()) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      shells
        .commandsExist([command])
        .then(([exists]) => {
          if (!cancelled) setCommandFound(exists);
        })
        .catch(() => {});
    }, COMMAND_CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [command]);

  const nameError = submitted && !name.trim() ? t("settings.profile.nameRequired") : null;
  const commandError = submitted && !command.trim() ? t("settings.profile.commandRequired") : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !command.trim()) return;
    const others = allProfiles.filter((p) => p.id !== base.id);
    onSave({
      ...base,
      id: profile ? base.id : newProfileId(name, others),
      name: name.trim(),
      icon,
      command: command.trim(),
      args: parseArgs(argsText),
      cwd: cwd.trim() || undefined,
      env: parseEnv(envText),
    });
  };

  const browseCommand = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: t("settings.profile.executables"), extensions: ["exe", "bat", "cmd"] }],
    });
    if (typeof selected === "string") setCommand(selected);
  };

  const browseCwd = async () => {
    const selected = await open({ multiple: false, directory: true });
    if (typeof selected === "string") setCwd(selected);
  };

  return (
    <form className="settings-form" onSubmit={submit} noValidate>
      <h4 className="settings-form__title">
        {t(profile ? "settings.profile.titleEdit" : "settings.profile.titleNew")}
      </h4>

      <div className="field">
        <label htmlFor="profile-name">{t("settings.profile.name")}</label>
        <input
          id="profile-name"
          value={name}
          maxLength={60}
          autoFocus
          aria-invalid={!!nameError}
          onChange={(e) => setName(e.target.value)}
        />
        {nameError && <p className="field__error">{nameError}</p>}
      </div>

      <fieldset className="field">
        <legend>{t("settings.profile.icon")}</legend>
        <div className="icon-picker">
          {PROFILE_ICONS.map((name) => (
            <label
              key={name}
              className={`icon-picker__option${icon === name ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="profile-icon"
                value={name}
                checked={icon === name}
                onChange={() => setIcon(name)}
              />
              <ProfileIcon icon={name} />
              <span>{t(`settings.icons.${name}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="profile-command">{t("settings.profile.command")}</label>
        <div className="field__row">
          <input
            id="profile-command"
            value={command}
            spellCheck={false}
            aria-invalid={!!commandError}
            onChange={(e) => setCommand(e.target.value)}
          />
          <button type="button" className="button" onClick={() => void browseCommand()}>
            {t("settings.profile.browse")}
          </button>
        </div>
        {commandError && <p className="field__error">{commandError}</p>}
        {!commandError && command.trim() && !commandFound && (
          <p className="field__warning">{t("settings.profile.commandNotFound")}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="profile-args">{t("settings.profile.args")}</label>
        <input
          id="profile-args"
          value={argsText}
          spellCheck={false}
          onChange={(e) => setArgsText(e.target.value)}
        />
        <p className="field__hint">{t("settings.profile.argsHint")}</p>
      </div>

      <div className="field">
        <label htmlFor="profile-cwd">{t("settings.profile.cwd")}</label>
        <div className="field__row">
          <input
            id="profile-cwd"
            value={cwd}
            spellCheck={false}
            placeholder="%USERPROFILE%"
            onChange={(e) => setCwd(e.target.value)}
          />
          <button type="button" className="button" onClick={() => void browseCwd()}>
            {t("settings.profile.browse")}
          </button>
        </div>
        <p className="field__hint">{t("settings.profile.cwdHint")}</p>
      </div>

      <div className="field">
        <label htmlFor="profile-env">{t("settings.profile.env")}</label>
        <textarea
          id="profile-env"
          rows={3}
          value={envText}
          spellCheck={false}
          onChange={(e) => setEnvText(e.target.value)}
        />
        <p className="field__hint">{t("settings.profile.envHint")}</p>
      </div>

      <div className="modal__actions">
        <button type="button" className="button" onClick={onCancel}>
          {t("settings.profile.cancel")}
        </button>
        <button type="submit" className="button button--primary">
          {t("settings.profile.save")}
        </button>
      </div>
    </form>
  );
}
