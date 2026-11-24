import { describe, expect, it } from "vitest";
import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";

function flatKeys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("traduções", () => {
  const base = flatKeys(ptBR).sort();

  it.each([
    ["en-US", enUS],
    ["es-ES", esES],
  ])("%s tem exatamente as mesmas chaves que pt-BR", (_name, locale) => {
    expect(flatKeys(locale).sort()).toEqual(base);
  });
});
