import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ALL_ACTIONS,
  defaultBinding,
  effectiveBindings,
  findConflict,
  formatCombo,
  isAssignableCombo,
  withBinding,
} from "../../keybindings/bindings";
import type { ActionId } from "../../keybindings/defaults";
import { actionLabel } from "../../keybindings/labels";
import { comboFromEvent } from "../../keybindings/matcher";
import type { Settings } from "../../lib/types";
import { readKeybindings } from "../../settings/defaults";
import { useSettings } from "../../stores/settings";
import { useUi } from "../../stores/ui";

export function KeybindingsSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState<ActionId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overrides = readKeybindings(settings);
  const bindings = effectiveBindings(overrides);

  const setBinding = (changes: [ActionId, string | null][]) =>
    void update((s) => {
      let next = readKeybindings(s);
      for (const [action, keys] of changes) next = withBinding(next, action, keys);
      return { ...s, keybindings: next };
    });

  const capture = async (action: ActionId, combo: string) => {
    if (!isAssignableCombo(combo)) {
      setError(t("settings.keybindings.needsModifier"));
      return;
    }
    setError(null);
    setRecording(null);
    const conflict = findConflict(bindings, action, combo);
    if (conflict) {
      const ok = await useUi.getState().askConfirm({
        title: t("settings.keybindings.conflictTitle"),
        message: t("settings.keybindings.conflictMessage", {
          combo: formatCombo(combo),
          action: actionLabel(t, conflict),
        }),
        confirmLabel: t("settings.keybindings.replace"),
        cancelLabel: t("settings.profile.cancel"),
      });
      if (!ok) return;
      setBinding([
        [conflict, null],
        [action, combo],
      ]);
    } else {
      setBinding([[action, combo]]);
    }
  };

  const resetAll = async () => {
    const ok = await useUi.getState().askConfirm({
      title: t("settings.keybindings.resetAllTitle"),
      message: t("settings.keybindings.resetAllMessage"),
      confirmLabel: t("settings.keybindings.resetAll"),
      cancelLabel: t("settings.profile.cancel"),
    });
    if (ok) void update((s) => ({ ...s, keybindings: [] }));
  };

  const q = query.trim().toLowerCase();
  const rows = ALL_ACTIONS.map((action) => {
    const combo = bindings.get(action) ?? null;
    return { action, label: actionLabel(t, action), combo, shown: combo ? formatCombo(combo) : "" };
  }).filter(
    (row) => !q || row.label.toLowerCase().includes(q) || row.shown.toLowerCase().includes(q),
  );

  return (
    <div className="settings-form">
      <p className="field__hint">{t("settings.keybindings.intro")}</p>
      <div className="shells__toolbar">
        <input
          type="text"
          className="keybindings__search"
          placeholder={t("settings.keybindings.search")}
          aria-label={t("settings.keybindings.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="button"
          disabled={overrides.length === 0}
          onClick={() => void resetAll()}
        >
          {t("settings.keybindings.resetAll")}
        </button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <table className="keybindings">
        <thead>
          <tr>
            <th scope="col">{t("settings.keybindings.action")}</th>
            <th scope="col">{t("settings.keybindings.shortcut")}</th>
            <th scope="col">
              <span className="visually-hidden">{t("settings.keybindings.options")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ action, label, combo, shown }) => {
            const isDefault = combo === defaultBinding(action);
            return (
              <tr key={action} className={isDefault ? undefined : "is-custom"}>
                <td>{label}</td>
                <td>
                  {recording === action ? (
                    <KeyRecorder
                      label={t("settings.keybindings.recording")}
                      onCancel={() => {
                        setRecording(null);
                        setError(null);
                      }}
                      onCapture={(c) => void capture(action, c)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="keycap"
                      title={t("settings.keybindings.record")}
                      aria-label={`${label}: ${shown || t("settings.keybindings.none")}. ${t("settings.keybindings.record")}`}
                      onClick={() => {
                        setError(null);
                        setRecording(action);
                      }}
                    >
                      {shown || (
                        <span className="keycap__none">{t("settings.keybindings.none")}</span>
                      )}
                    </button>
                  )}
                </td>
                <td className="keybindings__options">
                  {combo !== null && (
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => setBinding([[action, null]])}
                    >
                      {t("settings.keybindings.remove")}
                    </button>
                  )}
                  {!isDefault && (
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => {
                        const def = defaultBinding(action);
                        const conflict = def ? findConflict(bindings, action, def) : null;
                        if (def && conflict) void capture(action, def);
                        else setBinding([[action, def]]);
                      }}
                    >
                      {t("settings.keybindings.reset")}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="field__hint">{t("settings.keybindings.noResults")}</p>}
    </div>
  );
}

/** Captura a próxima combinação de teclas. Esc sozinho cancela. */
function KeyRecorder(props: { label: string; onCapture(combo: string): void; onCancel(): void }) {
  return (
    <button
      type="button"
      className="keycap keycap--recording"
      autoFocus
      onBlur={props.onCancel}
      onKeyDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const { key, ctrlKey, altKey, shiftKey, metaKey } = event;
        if (key === "Escape" && !ctrlKey && !altKey && !shiftKey && !metaKey) {
          props.onCancel();
          return;
        }
        const combo = comboFromEvent(event.nativeEvent);
        if (combo) props.onCapture(combo);
      }}
    >
      {props.label}
    </button>
  );
}
