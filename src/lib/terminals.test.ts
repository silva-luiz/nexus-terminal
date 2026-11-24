import { describe, expect, it } from "vitest";
import { buildFontStack, isMultiline } from "./terminals";

describe("isMultiline", () => {
  it("ignora quebra de linha só no final", () => {
    expect(isMultiline("git status")).toBe(false);
    expect(isMultiline("git status\n")).toBe(false);
    expect(isMultiline("git status\r\n\r\n")).toBe(false);
  });

  it("detecta várias linhas", () => {
    expect(isMultiline("cd api\nnpm start")).toBe(true);
    expect(isMultiline("a\r\nb\r\n")).toBe(true);
  });
});

describe("buildFontStack", () => {
  it("acrescenta fontes reserva", () => {
    expect(buildFontStack("Fira Code")).toBe('"Fira Code", "Cascadia Mono", Consolas, monospace');
    expect(buildFontStack("A, B")).toBe("A, B");
  });
});
