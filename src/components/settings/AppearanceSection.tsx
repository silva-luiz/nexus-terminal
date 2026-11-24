import { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppearanceSettings, Settings } from "../../lib/types";
import { FONT_SIZE, LINE_HEIGHT, readAppearance, readTheme } from "../../settings/defaults";
import { useSettings } from "../../stores/settings";
import { allThemes, useThemes } from "../../stores/themes";
import { useUi } from "../../stores/ui";
import { resolveTheme } from "../../themes/resolve";
import type { Theme } from "../../themes/theme";

const FONT_SUGGESTIONS = [
  "Cascadia Code",
  "Cascadia Mono",
  "Consolas",
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "Courier New",
];
const FONT_SIZES = Array.from(
  { length: FONT_SIZE.max - FONT_SIZE.min + 1 },
  (_, i) => FONT_SIZE.min + i,
);
const LINE_HEIGHTS = Array.from(
  { length: Math.round((LINE_HEIGHT.max - LINE_HEIGHT.min) * 10) + 1 },
  (_, i) => Math.round((LINE_HEIGHT.min + i / 10) * 10) / 10,
);

type Message = { kind: "ok" | "error"; text: string } | null;

export function AppearanceSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const userThemes = useThemes((s) => s.userThemes);
  const [message, setMessage] = useState<Message>(null);
  const [importing, setImporting] = useState(false);

  const themeSettings = readTheme(settings);
  const appearance = readAppearance(settings);
  const themes = allThemes(userThemes);
  const current = resolveTheme(themeSettings, themes);

  // Grava só o tema escolhido (descarta os campos antigos de modo claro/escuro).
  const setTheme = (selected: string) => void update((s) => ({ ...s, theme: { selected } }));
  const setAppearance = (patch: Partial<AppearanceSettings>) =>
    void update((s) => ({ ...s, appearance: { ...readAppearance(s), ...patch } }));

  const importTheme = async () => {
    setMessage(null);
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: t("settings.appearance.themeFiles"), extensions: ["json"] }],
    });
    if (typeof path !== "string") return;
    setImporting(true);
    try {
      const added = await useThemes.getState().importFile(path);
      setTheme(added[0].id);
      setMessage({
        kind: "ok",
        text: t("settings.appearance.imported", {
          count: added.length,
          names: added.map((th) => th.name).join(", "),
        }),
      });
    } catch (err) {
      setMessage({
        kind: "error",
        text: t("settings.appearance.importError", {
          error: err instanceof Error ? err.message : String(err),
        }),
      });
    } finally {
      setImporting(false);
    }
  };

  const deleteTheme = async (theme: Theme) => {
    const ok = await useUi.getState().askConfirm({
      title: t("settings.appearance.deleteThemeTitle"),
      message: t("settings.appearance.deleteThemeMessage", { name: theme.name }),
      confirmLabel: t("settings.shells.delete"),
      cancelLabel: t("settings.profile.cancel"),
    });
    if (!ok) return;
    try {
      await useThemes.getState().remove(theme.id);
    } catch (err) {
      setMessage({ kind: "error", text: String(err) });
    }
  };

  const themeGroup = (type: Theme["type"]) => (
    <div className="theme-group">
      <span className="theme-group__label">{t(`settings.appearance.group_${type}`)}</span>
      <div className="theme-grid">
        {themes
          .filter((th) => th.type === type)
          .map((th) => (
            <ThemeCard
              key={th.id}
              theme={th}
              selected={current.id === th.id}
              customLabel={t("settings.appearance.custom")}
              deleteLabel={t("settings.appearance.deleteTheme")}
              onSelect={() => setTheme(th.id)}
              onDelete={th.source === "user" ? () => void deleteTheme(th) : undefined}
            />
          ))}
      </div>
    </div>
  );

  return (
    <div className="settings-form">
      <div className="field" role="radiogroup" aria-labelledby="theme-label">
        <span id="theme-label" className="field__label">
          {t("settings.appearance.theme")}
        </span>
        {themeGroup("dark")}
        {themeGroup("light")}
      </div>

      <div className="field">
        <div className="field__row field__row--start">
          <button
            type="button"
            className="button"
            disabled={importing}
            onClick={() => void importTheme()}
          >
            {t("settings.appearance.import")}
          </button>
        </div>
        <p className="field__hint">{t("settings.appearance.importHint")}</p>
        {message && (
          <p className={message.kind === "ok" ? "field__success" : "field__error"} role="status">
            {message.text}
          </p>
        )}
      </div>

      <h4 className="settings-form__title">{t("settings.appearance.terminal")}</h4>

      <div className="field">
        <label htmlFor="font-family">{t("settings.appearance.font")}</label>
        <FontInput
          key={appearance.fontFamily}
          value={appearance.fontFamily}
          onCommit={(fontFamily) => setAppearance({ fontFamily })}
        />
        <p className="field__hint">{t("settings.appearance.fontHint")}</p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="font-size">{t("settings.appearance.fontSize")}</label>
          <select
            id="font-size"
            value={appearance.fontSize}
            onChange={(e) => setAppearance({ fontSize: Number(e.target.value) })}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="line-height">{t("settings.appearance.lineHeight")}</label>
          <select
            id="line-height"
            value={appearance.lineHeight}
            onChange={(e) => setAppearance({ lineHeight: Number(e.target.value) })}
          >
            {LINE_HEIGHTS.map((h) => (
              <option key={h} value={h}>
                {h.toFixed(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cursor-style">{t("settings.appearance.cursor")}</label>
          <select
            id="cursor-style"
            value={appearance.cursorStyle}
            onChange={(e) =>
              setAppearance({ cursorStyle: e.target.value as AppearanceSettings["cursorStyle"] })
            }
          >
            <option value="bar">{t("settings.appearance.cursor_bar")}</option>
            <option value="block">{t("settings.appearance.cursor_block")}</option>
            <option value="underline">{t("settings.appearance.cursor_underline")}</option>
          </select>
        </div>
      </div>

      <div className="field field--checkbox">
        <input
          id="cursor-blink"
          type="checkbox"
          checked={appearance.cursorBlink}
          onChange={(e) => setAppearance({ cursorBlink: e.target.checked })}
        />
        <label htmlFor="cursor-blink">{t("settings.appearance.cursorBlink")}</label>
      </div>
    </div>
  );
}

/** Grava a fonte só ao sair do campo ou apertar Enter, para não redesenhar a cada letra. */
function FontInput({ value, onCommit }: { value: string; onCommit(value: string): void }) {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const clean = draft.trim();
    if (clean && clean !== value) onCommit(clean);
    else setDraft(value);
  };
  return (
    <>
      <input
        id="font-family"
        list="font-suggestions"
        value={draft}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      <datalist id="font-suggestions">
        {FONT_SUGGESTIONS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
    </>
  );
}

function ThemeCard(props: {
  theme: Theme;
  selected: boolean;
  customLabel: string;
  deleteLabel: string;
  onSelect(): void;
  onDelete?: () => void;
}) {
  const { theme } = props;
  const swatches = ["red", "green", "yellow", "blue", "magenta", "cyan"] as const;
  return (
    <div className={`theme-card${props.selected ? " is-selected" : ""}`}>
      <button
        type="button"
        role="radio"
        aria-checked={props.selected}
        className="theme-card__select"
        onClick={props.onSelect}
      >
        <span
          className="theme-card__preview"
          style={{ background: theme.terminal.background, color: theme.terminal.foreground }}
        >
          <span className="theme-card__prompt">
            <span style={{ color: theme.terminal.green }}>user</span>
            <span style={{ color: theme.terminal.blue }}> ~/nexus</span> $ ls
          </span>
          <span className="theme-card__swatches">
            {swatches.map((key) => (
              <span key={key} style={{ background: theme.terminal[key] }} />
            ))}
          </span>
        </span>
        <span className="theme-card__name">
          {theme.name}
          {theme.source === "user" && <span className="badge">{props.customLabel}</span>}
        </span>
      </button>
      {props.onDelete && (
        <button
          type="button"
          className="icon-button icon-button--small theme-card__delete"
          aria-label={`${props.deleteLabel}: ${theme.name}`}
          title={props.deleteLabel}
          onClick={props.onDelete}
        >
          ×
        </button>
      )}
    </div>
  );
}
