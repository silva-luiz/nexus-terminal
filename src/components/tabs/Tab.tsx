import { useRef, useState, type DragEvent, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { MAX_TITLE_LENGTH, useSessions, type TerminalTab } from "../../stores/sessions";
import { focusActiveTerminal } from "../../lib/terminals";

export const TAB_DRAG_TYPE = "application/x-nexus-tab";

interface Props {
  tab: TerminalTab;
  index: number;
  active: boolean;
  onContextMenu(event: MouseEvent, tab: TerminalTab): void;
}

export function Tab({ tab, index, active, onContextMenu }: Props) {
  const { t } = useTranslation();
  const renaming = useSessions((s) => s.renamingId === tab.id);
  const { activate, close, startRename, move } = useSessions.getState();
  const [dropTarget, setDropTarget] = useState(false);

  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(TAB_DRAG_TYPE, tab.id);
    event.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (event: DragEvent) => {
    setDropTarget(false);
    const draggedId = event.dataTransfer.getData(TAB_DRAG_TYPE);
    if (draggedId && draggedId !== tab.id) move(draggedId, index);
  };

  const classes = [
    "tab",
    active && "is-active",
    tab.status === "exited" && "is-exited",
    dropTarget && "is-drop-target",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="tab"
      aria-selected={active}
      title={tab.title}
      draggable={!renaming}
      onDragStart={onDragStart}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(TAB_DRAG_TYPE)) {
          event.preventDefault();
          setDropTarget(true);
        }
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={onDrop}
      onClick={() => activate(tab.id)}
      onDoubleClick={() => startRename(tab.id)}
      onAuxClick={(event) => {
        if (event.button === 1) close(tab.id);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        activate(tab.id);
        onContextMenu(event, tab);
      }}
    >
      {renaming ? (
        <RenameInput tab={tab} label={t("tabs.renameLabel")} />
      ) : (
        <span className="tab__title">{tab.title}</span>
      )}
      <button
        type="button"
        className="tab__close"
        aria-label={t("tabs.close")}
        title={t("tabs.close")}
        onClick={(event) => {
          event.stopPropagation();
          close(tab.id);
        }}
      >
        ×
      </button>
    </div>
  );
}

function RenameInput({ tab, label }: { tab: TerminalTab; label: string }) {
  const finished = useRef(false);
  const { rename, startRename } = useSessions.getState();

  const finish = (save: boolean, value: string) => {
    if (finished.current) return;
    finished.current = true;
    if (save) rename(tab.id, value);
    else startRename(null);
    focusActiveTerminal();
  };

  return (
    <input
      className="tab__rename"
      aria-label={label}
      defaultValue={tab.titleLocked ? tab.title : ""}
      placeholder={tab.defaultTitle}
      maxLength={MAX_TITLE_LENGTH}
      autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") finish(true, event.currentTarget.value);
        if (event.key === "Escape") finish(false, "");
      }}
      onBlur={(event) => finish(true, event.currentTarget.value)}
    />
  );
}
