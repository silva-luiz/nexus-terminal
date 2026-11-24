import { describe, expect, it } from "vitest";
import {
  comboIndex,
  effectiveBindings,
  findConflict,
  formatCombo,
  isAssignableCombo,
  withBinding,
} from "./bindings";

describe("atalhos efetivos", () => {
  it("aplica personalizações por cima dos padrões e ignora ações desconhecidas", () => {
    const b = effectiveBindings([
      { action: "tab.new", keys: "Shift+Ctrl+N" },
      { action: "tab.close", keys: null },
      { action: "nao.existe", keys: "ctrl+x" },
    ]);
    expect(b.get("tab.new")).toBe("ctrl+shift+n");
    expect(b.get("tab.close")).toBeNull();
    expect(b.get("tab.rename")).toBe("f2");
    expect(b.has("nao.existe" as never)).toBe(false);
  });

  it("índice por combinação ignora ações desativadas", () => {
    const index = comboIndex(effectiveBindings([{ action: "tab.close", keys: null }]));
    expect(index.get("ctrl+shift+t")).toBe("tab.new");
    expect(index.has("ctrl+shift+w")).toBe(false);
  });

  it("encontra conflitos", () => {
    const b = effectiveBindings([]);
    expect(findConflict(b, "tab.close", "ctrl+shift+t")).toBe("tab.new");
    expect(findConflict(b, "tab.new", "ctrl+shift+t")).toBeNull();
    expect(findConflict(b, "tab.new", "ctrl+alt+z")).toBeNull();
  });
});

describe("withBinding", () => {
  it("guarda só o que difere do padrão", () => {
    let o = withBinding([], "tab.new", "ctrl+alt+t");
    expect(o).toEqual([{ action: "tab.new", keys: "ctrl+alt+t" }]);
    o = withBinding(o, "tab.new", "ctrl+shift+t");
    expect(o).toEqual([]);
    o = withBinding(o, "tab.close", null);
    expect(o).toEqual([{ action: "tab.close", keys: null }]);
  });
});

describe("validação e formato", () => {
  it("exige Ctrl, Alt ou Win, exceto teclas F", () => {
    expect(isAssignableCombo("ctrl+shift+t")).toBe(true);
    expect(isAssignableCombo("alt+up")).toBe(true);
    expect(isAssignableCombo("f2")).toBe(true);
    expect(isAssignableCombo("shift+f12")).toBe(true);
    expect(isAssignableCombo("t")).toBe(false);
    expect(isAssignableCombo("shift+a")).toBe(false);
    expect(isAssignableCombo("ctrl")).toBe(false);
  });

  it("formata para exibição", () => {
    expect(formatCombo("ctrl+shift+pageup")).toBe("Ctrl+Shift+PageUp");
    expect(formatCombo("ctrl+,")).toBe("Ctrl+,");
    expect(formatCombo("alt+left")).toBe("Alt+←");
    expect(formatCombo("f2")).toBe("F2");
  });
});
