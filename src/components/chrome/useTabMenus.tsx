import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { shortcutLabel } from "../../keybindings/bindings";
import { requestCloseOthers, requestCloseTab, requestCloseToRight } from "../../lib/closeTabs";
import { useSessions, type TerminalTab } from "../../stores/sessions";
import { useSettings } from "../../stores/settings";
import { ProfileIcon } from "../ui/ProfileIcon";
import { ContextMenu, type MenuEntry } from "../ui/ContextMenu";

interface MenuState {
  x: number;
  y: number;
  items: MenuEntry[];
}

/** Menus da lista de abas: clique direito numa aba e escolha de perfil para nova aba. */
export function useTabMenus(orientation: "horizontal" | "vertical"): {
  menu: ReactNode;
  openTabMenu(event: MouseEvent, tab: TerminalTab): void;
  openProfileMenu(event: MouseEvent<HTMLButtonElement>): void;
} {
  const { t } = useTranslation();
  const [state, setState] = useState<MenuState | null>(null);
  const close = useCallback(() => setState(null), []);

  const openTabMenu = (event: MouseEvent, tab: TerminalTab) => {
    const s = useSessions.getState();
    const index = s.tabs.findIndex((x) => x.id === tab.id);
    setState({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: t("tabs.rename"),
          hint: shortcutLabel("tab.rename"),
          onSelect: () => s.startRename(tab.id),
        },
        { label: t("tabs.restart"), onSelect: () => s.restart(tab.id) },
        "separator",
        {
          label: t("tabs.close"),
          hint: shortcutLabel("tab.close"),
          onSelect: () => void requestCloseTab(tab.id),
        },
        {
          label: t("tabs.closeOthers"),
          disabled: s.tabs.length < 2,
          onSelect: () => void requestCloseOthers(tab.id),
        },
        {
          // Na lista vertical, "à direita" vira "abaixo".
          label: t(orientation === "vertical" ? "tabs.closeBelow" : "tabs.closeToRight"),
          disabled: index === s.tabs.length - 1,
          onSelect: () => void requestCloseToRight(tab.id),
        },
      ],
    });
  };

  const openProfileMenu = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const allProfiles = useSettings.getState().settings?.profiles ?? [];
    const defaultId = useSessions.getState().defaultProfileId;
    setState({
      x: rect.left,
      y: rect.bottom + 4,
      items: useSessions.getState().profiles.map((profile, i) => ({
        label: profile.id === defaultId ? `${profile.name} (${t("tabs.default")})` : profile.name,
        icon: (
          <ProfileIcon icon={allProfiles.find((p) => p.id === profile.id)?.icon ?? "terminal"} />
        ),
        hint: shortcutLabel(`tab.newWithProfile.${i + 1}`),
        onSelect: () => useSessions.getState().create(profile.id),
      })),
    });
  };

  return {
    menu: state ? <ContextMenu {...state} onClose={close} /> : null,
    openTabMenu,
    openProfileMenu,
  };
}
