import { describe, expect, it } from "vitest";
import type { Profile, Settings } from "../lib/types";
import {
  duplicateProfile,
  formatArgs,
  formatEnv,
  moveProfile,
  newProfileId,
  parseArgs,
  parseEnv,
  removeProfile,
  setDefaultProfile,
  slugify,
  toggleHidden,
  upsertProfile,
  visibleProfiles,
} from "./profiles";

const profile = (id: string, extra: Partial<Profile> = {}): Profile => ({
  id,
  name: id.toUpperCase(),
  icon: "terminal",
  command: `${id}.exe`,
  args: [],
  env: {},
  hidden: false,
  source: "detected",
  ...extra,
});

const settings = (): Settings => ({
  version: 1,
  general: { defaultProfile: "a", confirmCloseRunning: true, futureKey: 1 },
  profiles: [profile("a"), profile("b"), profile("c", { hidden: true })],
  theme: { dark: "x" },
});

describe("edição de perfis", () => {
  it("preserva chaves desconhecidas ao alterar", () => {
    const next = setDefaultProfile(settings(), "b");
    expect(next.general).toEqual({ defaultProfile: "b", confirmCloseRunning: true, futureKey: 1 });
    expect(next.theme).toEqual({ dark: "x" });
  });

  it("insere ou atualiza", () => {
    const updated = upsertProfile(settings(), profile("a", { name: "Novo" }));
    expect(updated.profiles.map((p) => p.name)).toEqual(["Novo", "B", "C"]);
    const added = upsertProfile(settings(), profile("d"));
    expect(added.profiles.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("remove, oculta e lista visíveis", () => {
    expect(removeProfile(settings(), "b").profiles.map((p) => p.id)).toEqual(["a", "c"]);
    const toggled = toggleHidden(settings(), "c");
    expect(visibleProfiles(toggled).map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(visibleProfiles(settings()).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("move sem sair dos limites", () => {
    expect(moveProfile(settings(), "b", -1).profiles.map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(moveProfile(settings(), "a", -1).profiles.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("duplica logo abaixo como perfil personalizado e visível", () => {
    const s = settings();
    s.profiles[0].env = { X: "1" };
    const next = duplicateProfile(s, "a", "(cópia)");
    expect(next.profiles.map((p) => p.id)).toEqual(["a", "a-copia", "b", "c"]);
    expect(next.profiles[1]).toMatchObject({
      name: "A (cópia)",
      source: "custom",
      env: { X: "1" },
    });
    expect(next.profiles[1].env).not.toBe(s.profiles[0].env);
  });
});

describe("IDs", () => {
  it("gera slug sem acentos", () => {
    expect(slugify("Git Bash — Produção!")).toBe("git-bash-producao");
  });

  it("evita IDs repetidos", () => {
    expect(newProfileId("A", [profile("a"), profile("a-2")])).toBe("a-3");
    expect(newProfileId("!!!", [])).toBe("perfil");
  });
});

describe("argumentos e variáveis", () => {
  it("separa argumentos respeitando aspas", () => {
    expect(parseArgs('--login  -i "C:\\Minha Pasta" ""')).toEqual([
      "--login",
      "-i",
      "C:\\Minha Pasta",
      "",
    ]);
    expect(parseArgs("   ")).toEqual([]);
  });

  it("formatar e ler de volta dá o mesmo resultado", () => {
    const args = ["-d", "Ubuntu 22", "", "-x"];
    expect(parseArgs(formatArgs(args))).toEqual(args);
  });

  it("lê variáveis de ambiente linha a linha", () => {
    expect(parseEnv("A=1\n  B = x=y\n=sem nome\nlixo\r\nC=")).toEqual({ A: "1", B: " x=y", C: "" });
    expect(parseEnv(formatEnv({ A: "1", B: "2" }))).toEqual({ A: "1", B: "2" });
  });
});
