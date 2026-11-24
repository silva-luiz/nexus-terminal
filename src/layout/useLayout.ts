import { useMemo } from "react";
import type { LayoutSettings, ViewMode } from "../lib/types";
import { parseLayout, readLayout } from "../settings/defaults";
import { useSettings } from "../stores/settings";

/** Layout atual (posição das abas, modo de visualização, grade). */
export function useLayout(): LayoutSettings {
  // Seleciona o objeto cru (referência estável) e converte fora do seletor.
  const raw = useSettings((s) => s.settings?.layout);
  return useMemo(() => parseLayout(raw), [raw]);
}

export function updateLayout(patch: Partial<LayoutSettings>): void {
  void useSettings.getState().update((s) => ({ ...s, layout: { ...readLayout(s), ...patch } }));
}

export function setViewMode(viewMode: ViewMode): void {
  updateLayout({ viewMode });
}

export function toggleViewMode(): void {
  const current = readLayout(useSettings.getState().settings).viewMode;
  setViewMode(current === "grid" ? "tabs" : "grid");
}
