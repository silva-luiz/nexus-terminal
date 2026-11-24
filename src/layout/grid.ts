import type { LayoutSettings } from "../lib/types";

/** Posição de uma célula da grade, em frações da área (0 a 1). */
export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Quantas colunas usar para `count` terminais. "auto" deixa a grade o mais quadrada possível. */
export function gridColumns(count: number, max: LayoutSettings["gridColumns"]): number {
  if (count <= 0) return 0;
  const auto = Math.ceil(Math.sqrt(count));
  return Math.max(1, Math.min(count, max === "auto" ? auto : max));
}

/**
 * Distribui os terminais em linhas. A última linha pode ter menos terminais; nesse caso eles
 * ficam mais largos e ocupam a linha toda (sem buracos na grade).
 */
export function gridRects(
  ids: string[],
  max: LayoutSettings["gridColumns"],
): Map<string, CellRect> {
  const rects = new Map<string, CellRect>();
  const count = ids.length;
  const cols = gridColumns(count, max);
  if (cols === 0) return rects;
  const rows = Math.ceil(count / cols);
  ids.forEach((id, i) => {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? count - row * cols : cols;
    const col = i - row * cols;
    rects.set(id, { x: col / inRow, y: row / rows, w: 1 / inRow, h: 1 / rows });
  });
  return rects;
}
