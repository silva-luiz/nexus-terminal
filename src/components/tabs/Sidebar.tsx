import { useState, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { updateLayout } from "../../layout/useLayout";
import { SIDEBAR_WIDTH } from "../../settings/defaults";
import { useSessions } from "../../stores/sessions";
import { NewTabButtons } from "../chrome/ToolbarButtons";
import { useTabMenus } from "../chrome/useTabMenus";
import { Tab } from "./Tab";

interface Props {
  side: "left" | "right";
  width: number;
}

const clampWidth = (w: number) =>
  Math.round(Math.max(SIDEBAR_WIDTH.min, Math.min(SIDEBAR_WIDTH.max, w)));

/** Abas na lateral: lista vertical de terminais, com largura ajustável pela borda. */
export function Sidebar({ side, width }: Props) {
  const { t } = useTranslation();
  const tabs = useSessions((s) => s.tabs);
  const activeId = useSessions((s) => s.activeId);
  const { menu, openTabMenu, openProfileMenu } = useTabMenus("vertical");
  // Largura enquanto arrasta; só é salva ao soltar.
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const currentWidth = dragWidth ?? width;

  const widthAt = (event: PointerEvent) =>
    clampWidth(side === "left" ? event.clientX : window.innerWidth - event.clientX);

  return (
    <aside className={`sidebar sidebar--${side}`} style={{ width: currentWidth }}>
      <div className="sidebar__header">
        <span className="sidebar__label">{t("layout.terminals")}</span>
        <NewTabButtons onProfileMenu={openProfileMenu} />
      </div>
      <div className="sidebar__tabs" role="tablist" aria-orientation="vertical">
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            tab={tab}
            index={index}
            active={tab.id === activeId}
            orientation="vertical"
            onContextMenu={openTabMenu}
          />
        ))}
      </div>
      <div
        className="sidebar__resize"
        role="separator"
        aria-orientation="vertical"
        aria-label={t("layout.resizeSidebar")}
        aria-valuemin={SIDEBAR_WIDTH.min}
        aria-valuemax={SIDEBAR_WIDTH.max}
        aria-valuenow={currentWidth}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragWidth(widthAt(event));
        }}
        onPointerMove={(event) => {
          if (dragWidth !== null) setDragWidth(widthAt(event));
        }}
        onPointerUp={(event) => {
          if (dragWidth === null) return;
          updateLayout({ sidebarWidth: widthAt(event) });
          setDragWidth(null);
        }}
        onKeyDown={(event) => {
          // Teclado: setas ajustam a largura de 10 em 10 pixels.
          const grow = side === "left" ? "ArrowRight" : "ArrowLeft";
          const shrink = side === "left" ? "ArrowLeft" : "ArrowRight";
          if (event.key !== grow && event.key !== shrink) return;
          event.preventDefault();
          updateLayout({ sidebarWidth: clampWidth(width + (event.key === grow ? 10 : -10)) });
        }}
      />
      {menu}
    </aside>
  );
}
