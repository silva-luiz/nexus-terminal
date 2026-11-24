import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { shells } from "../../lib/ipc";
import type { Profile, Settings } from "../../lib/types";
import {
  duplicateProfile,
  moveProfile,
  removeProfile,
  setDefaultProfile,
  toggleHidden,
  upsertProfile,
} from "../../settings/profiles";
import { useSettings } from "../../stores/settings";
import { useUi } from "../../stores/ui";
import { ProfileIcon } from "../ui/ProfileIcon";
import { ProfileEditor } from "./ProfileEditor";

type Editing = { profile: Profile | null } | null;

export function ShellsSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const [editing, setEditing] = useState<Editing>(null);
  const [detecting, setDetecting] = useState(false);
  const [missing, setMissing] = useState<Set<string>>(new Set());

  const commandsKey = settings.profiles.map((p) => `${p.id}\n${p.command}`).join("\n");
  useEffect(() => {
    let cancelled = false;
    const profiles = useSettings.getState().settings?.profiles ?? [];
    shells
      .commandsExist(profiles.map((p) => p.command))
      .then((exists) => {
        if (cancelled) return;
        setMissing(new Set(profiles.filter((_, i) => !exists[i]).map((p) => p.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [commandsKey]);

  if (editing) {
    return (
      <ProfileEditor
        profile={editing.profile}
        allProfiles={settings.profiles}
        onCancel={() => setEditing(null)}
        onSave={(profile) => {
          void update((s) => upsertProfile(s, profile));
          setEditing(null);
        }}
      />
    );
  }

  const confirmDelete = async (profile: Profile) => {
    const ok = await useUi.getState().askConfirm({
      title: t("settings.shells.deleteTitle"),
      message:
        t("settings.shells.deleteMessage", { name: profile.name }) +
        (profile.source === "detected" ? ` ${t("settings.shells.deleteDetectedNote")}` : ""),
      confirmLabel: t("settings.shells.delete"),
      cancelLabel: t("settings.profile.cancel"),
    });
    if (ok) void update((s) => removeProfile(s, profile.id));
  };

  return (
    <div className="shells">
      <p className="field__hint">{t("settings.shells.intro")}</p>
      <div className="shells__toolbar">
        <button
          type="button"
          className="button button--primary"
          onClick={() => setEditing({ profile: null })}
        >
          {t("settings.shells.add")}
        </button>
        <button
          type="button"
          className="button"
          disabled={detecting}
          onClick={async () => {
            setDetecting(true);
            await useSettings.getState().redetect();
            setDetecting(false);
          }}
        >
          {t("settings.shells.redetect")}
        </button>
      </div>

      <ul className="profile-list">
        {settings.profiles.map((profile, index) => {
          const isDefault = profile.id === settings.general.defaultProfile;
          return (
            <li key={profile.id} className={`profile-row${profile.hidden ? " is-hidden" : ""}`}>
              <ProfileIcon icon={profile.icon} />
              <div className="profile-row__info">
                <div className="profile-row__name">
                  {profile.name}
                  {isDefault && (
                    <span className="badge badge--accent">{t("settings.shells.default")}</span>
                  )}
                  <span className="badge">
                    {t(
                      profile.source === "detected"
                        ? "settings.shells.detected"
                        : "settings.shells.custom",
                    )}
                  </span>
                  {profile.hidden && <span className="badge">{t("settings.shells.hidden")}</span>}
                  {missing.has(profile.id) && (
                    <span className="badge badge--danger">{t("settings.shells.notFound")}</span>
                  )}
                </div>
                <code className="profile-row__command" title={profile.command}>
                  {profile.command} {profile.args.join(" ")}
                </code>
              </div>
              <div className="profile-row__actions">
                <IconAction
                  label={t("settings.shells.moveUp")}
                  disabled={index === 0}
                  onClick={() => void update((s) => moveProfile(s, profile.id, -1))}
                >
                  ↑
                </IconAction>
                <IconAction
                  label={t("settings.shells.moveDown")}
                  disabled={index === settings.profiles.length - 1}
                  onClick={() => void update((s) => moveProfile(s, profile.id, 1))}
                >
                  ↓
                </IconAction>
                {!isDefault && !profile.hidden && (
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => void update((s) => setDefaultProfile(s, profile.id))}
                  >
                    {t("settings.shells.setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => setEditing({ profile })}
                >
                  {t("settings.shells.edit")}
                </button>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() =>
                    void update((s) =>
                      duplicateProfile(s, profile.id, t("settings.shells.copySuffix")),
                    )
                  }
                >
                  {t("settings.shells.duplicate")}
                </button>
                <button
                  type="button"
                  className="button button--small"
                  disabled={isDefault && !profile.hidden}
                  onClick={() => void update((s) => toggleHidden(s, profile.id))}
                >
                  {t(profile.hidden ? "settings.shells.show" : "settings.shells.hide")}
                </button>
                <button
                  type="button"
                  className="button button--small button--danger-text"
                  onClick={() => void confirmDelete(profile)}
                >
                  {t("settings.shells.delete")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconAction(props: {
  label: string;
  disabled?: boolean;
  onClick(): void;
  children: string;
}) {
  return (
    <button
      type="button"
      className="icon-button icon-button--small"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
