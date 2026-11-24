import { describe, expect, it } from "vitest";
import { comboFromEvent, keyFromCode, normalizeCombo } from "./matcher";
import { defaultKeybindings } from "./defaults";

const ev = (
  code: string,
  mods: Partial<Record<"ctrl" | "alt" | "shift" | "meta", boolean>> = {},
) => ({
  code,
  ctrlKey: !!mods.ctrl,
  altKey: !!mods.alt,
  shiftKey: !!mods.shift,
  metaKey: !!mods.meta,
});

describe("keyFromCode", () => {
  it("converte letras, dígitos e teclas especiais", () => {
    expect(keyFromCode("KeyT")).toBe("t");
    expect(keyFromCode("Digit1")).toBe("1");
    expect(keyFromCode("Numpad3")).toBe("3");
    expect(keyFromCode("F2")).toBe("f2");
    expect(keyFromCode("PageUp")).toBe("pageup");
    expect(keyFromCode("Equal")).toBe("=");
    expect(keyFromCode("ArrowLeft")).toBe("left");
  });
});

describe("comboFromEvent", () => {
  it("monta a combinação na ordem fixa de modificadores", () => {
    expect(comboFromEvent(ev("KeyT", { shift: true, ctrl: true }))).toBe("ctrl+shift+t");
    expect(comboFromEvent(ev("Tab", { ctrl: true }))).toBe("ctrl+tab");
    expect(comboFromEvent(ev("F2"))).toBe("f2");
  });

  it("usa a tecla física: Ctrl+Shift+1 continua '1' mesmo com Shift", () => {
    expect(comboFromEvent(ev("Digit1", { ctrl: true, shift: true }))).toBe("ctrl+shift+1");
  });

  it("ignora modificador sozinho", () => {
    expect(comboFromEvent(ev("ShiftLeft", { shift: true }))).toBeNull();
  });
});

describe("normalizeCombo", () => {
  it("reordena e padroniza", () => {
    expect(normalizeCombo("Shift+Ctrl+T")).toBe("ctrl+shift+t");
    expect(normalizeCombo("control + alt + up")).toBe("ctrl+alt+up");
  });

  it("todos os atalhos padrão já estão normalizados e sem repetição", () => {
    const combos = defaultKeybindings.map((b) => b.keys);
    for (const combo of combos) expect(normalizeCombo(combo)).toBe(combo);
    expect(new Set(combos).size).toBe(combos.length);
  });
});
