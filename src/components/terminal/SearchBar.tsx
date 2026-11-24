import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ISearchOptions } from "@xterm/addon-search";
import { focusActiveTerminal, getActiveSearch } from "../../lib/terminals";
import { useSessions } from "../../stores/sessions";
import { useUi } from "../../stores/ui";
import { getAppliedTheme } from "../../themes/apply";
import { mix } from "../../themes/color";

interface Query {
  text: string;
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
}

function searchOptions(query: Query, incremental: boolean): ISearchOptions {
  const theme = getAppliedTheme();
  const accent = theme?.ui.accent ?? "#5b8cff";
  const background = theme?.terminal.background ?? "#000000";
  return {
    caseSensitive: query.caseSensitive,
    regex: query.regex,
    wholeWord: query.wholeWord,
    incremental,
    decorations: {
      matchBackground: mix(background, accent, 0.35),
      matchOverviewRuler: accent,
      activeMatchBackground: accent,
      activeMatchColorOverviewRuler: accent,
    },
  };
}

/** Busca no terminal ativo. Retorna false se a expressão regular for inválida. */
function runSearch(query: Query, direction: "next" | "prev", incremental = false): boolean {
  const search = getActiveSearch();
  if (!search) return true;
  if (!query.text) {
    search.clearDecorations();
    return true;
  }
  try {
    if (direction === "next") search.findNext(query.text, searchOptions(query, incremental));
    else search.findPrevious(query.text, searchOptions(query, false));
    return true;
  } catch {
    return false;
  }
}

/** Barra de busca do terminal ativo (Ctrl+Shift+F). */
export function SearchBar() {
  const { t } = useTranslation();
  const open = useUi((s) => s.searchOpen);
  const focusToken = useUi((s) => s.searchFocusToken);
  const activeId = useSessions((s) => s.activeId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<Query>({
    text: "",
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  });
  const [results, setResults] = useState<{ index: number; count: number } | null>(null);
  const [invalid, setInvalid] = useState(false);
  // Última busca, para refazê-la ao trocar de aba (atualizada nos eventos, não na renderização).
  const queryRef = useRef(query);

  // Ao abrir (ou apertar Ctrl+Shift+F de novo), foca e seleciona o texto.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [open, focusToken]);

  // Contagem de resultados do terminal ativo; refaz a busca ao trocar de aba.
  useEffect(() => {
    if (!open) return;
    const search = getActiveSearch();
    if (!search) return;
    const sub = search.onDidChangeResults(({ resultIndex, resultCount }) =>
      setResults({ index: resultIndex, count: resultCount }),
    );
    runSearch(queryRef.current, "next", true);
    return () => {
      sub.dispose();
      search.clearDecorations();
    };
  }, [open, activeId]);

  if (!open) return null;

  const update = (patch: Partial<Query>) => {
    const next = { ...query, ...patch };
    queryRef.current = next;
    setQuery(next);
    if (!next.text) setResults(null);
    setInvalid(!runSearch(next, "next", true));
  };

  const step = (direction: "next" | "prev") => setInvalid(!runSearch(query, direction));

  const close = () => {
    useUi.getState().closeSearch();
    focusActiveTerminal();
  };

  const status = invalid
    ? t("search.invalid")
    : !query.text || !results
      ? ""
      : results.count === 0
        ? t("search.noResults")
        : t("search.position", {
            index: results.index >= 0 ? results.index + 1 : "?",
            count: results.count,
          });

  return (
    <div className="search-bar" role="search">
      <input
        ref={inputRef}
        type="text"
        className="search-bar__input"
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        aria-invalid={invalid}
        value={query.text}
        spellCheck={false}
        onChange={(e) => update({ text: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            step(e.shiftKey ? "prev" : "next");
          } else if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
      />
      <span className="search-bar__status" aria-live="polite">
        {status}
      </span>
      <Toggle
        label={t("search.caseSensitive")}
        text="Aa"
        on={query.caseSensitive}
        set={(caseSensitive) => update({ caseSensitive })}
      />
      <Toggle
        label={t("search.wholeWord")}
        text="ab"
        underline
        on={query.wholeWord}
        set={(wholeWord) => update({ wholeWord })}
      />
      <Toggle
        label={t("search.regex")}
        text=".*"
        on={query.regex}
        set={(regex) => update({ regex })}
      />
      <button
        type="button"
        className="icon-button icon-button--small"
        aria-label={t("search.previous")}
        title={`${t("search.previous")} (Shift+Enter)`}
        onClick={() => step("prev")}
      >
        ↑
      </button>
      <button
        type="button"
        className="icon-button icon-button--small"
        aria-label={t("search.next")}
        title={`${t("search.next")} (Enter)`}
        onClick={() => step("next")}
      >
        ↓
      </button>
      <button
        type="button"
        className="icon-button icon-button--small"
        aria-label={t("search.close")}
        title={`${t("search.close")} (Esc)`}
        onClick={close}
      >
        ×
      </button>
    </div>
  );
}

function Toggle(props: {
  label: string;
  text: string;
  underline?: boolean;
  on: boolean;
  set(value: boolean): void;
}) {
  return (
    <button
      type="button"
      className={`search-bar__toggle${props.underline ? " is-underlined" : ""}`}
      aria-pressed={props.on}
      aria-label={props.label}
      title={props.label}
      onClick={() => props.set(!props.on)}
    >
      {props.text}
    </button>
  );
}
