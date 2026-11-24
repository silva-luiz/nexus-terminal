import { describe, expect, it } from "vitest";
import { gridColumns, gridRects } from "./grid";

describe("gridColumns", () => {
  it("automático fica o mais quadrado possível", () => {
    expect([0, 1, 2, 3, 4, 5, 9, 10].map((n) => gridColumns(n, "auto"))).toEqual([
      0, 1, 2, 2, 2, 3, 3, 4,
    ]);
  });

  it("respeita o máximo e nunca passa do número de terminais", () => {
    expect(gridColumns(6, 2)).toBe(2);
    expect(gridColumns(2, 4)).toBe(2);
    expect(gridColumns(5, 1)).toBe(1);
  });
});

describe("gridRects", () => {
  it("dois terminais ficam lado a lado", () => {
    const r = gridRects(["a", "b"], "auto");
    expect(r.get("a")).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(r.get("b")).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
  });

  it("três terminais: dois em cima e um ocupando a linha de baixo", () => {
    const r = gridRects(["a", "b", "c"], "auto");
    expect(r.get("a")).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 });
    expect(r.get("b")).toEqual({ x: 0.5, y: 0, w: 0.5, h: 0.5 });
    expect(r.get("c")).toEqual({ x: 0, y: 0.5, w: 1, h: 0.5 });
  });

  it("cobre a área inteira sem sobreposição", () => {
    for (let n = 1; n <= 12; n++) {
      for (const max of ["auto", 1, 2, 3, 4] as const) {
        const ids = Array.from({ length: n }, (_, i) => String(i));
        const area = [...gridRects(ids, max).values()].reduce((sum, c) => sum + c.w * c.h, 0);
        expect(area).toBeCloseTo(1, 10);
      }
    }
  });

  it("uma coluna empilha na vertical", () => {
    const r = gridRects(["a", "b"], 1);
    expect(r.get("b")).toEqual({ x: 0, y: 0.5, w: 1, h: 0.5 });
  });
});
