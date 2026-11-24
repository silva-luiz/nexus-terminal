import { beforeEach, describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH, useSessions } from "./sessions";

const store = () => useSessions.getState();

beforeEach(() => {
  useSessions.setState({
    profiles: [
      { id: "powershell", name: "PowerShell" },
      { id: "cmd", name: "CMD" },
    ],
    defaultProfileId: "powershell",
    tabs: [],
    activeId: null,
    renamingId: null,
    counters: {},
  });
});

describe("criar abas", () => {
  it("usa o perfil padrão e numera abas repetidas", () => {
    store().create();
    store().create();
    store().create("cmd");
    expect(store().tabs.map((t) => t.title)).toEqual(["PowerShell", "PowerShell 2", "CMD"]);
    expect(store().activeId).toBe(store().tabs[2].id);
  });

  it("ensureOne só cria quando não há abas", () => {
    store().ensureOne();
    store().ensureOne();
    expect(store().tabs).toHaveLength(1);
  });
});

describe("renomear", () => {
  it("define o nome e trava contra o título do shell", () => {
    const id = store().create();
    store().startRename(id);
    store().rename(id, "  API  ");
    store().setShellTitle(id, "C:\\Windows\\system32");
    const tab = store().tabs[0];
    expect(tab.title).toBe("API");
    expect(tab.titleLocked).toBe(true);
    expect(store().renamingId).toBeNull();
  });

  it("nome vazio volta ao padrão e destrava", () => {
    const id = store().create();
    store().rename(id, "API");
    store().rename(id, "   ");
    expect(store().tabs[0]).toMatchObject({ title: "PowerShell", titleLocked: false });
  });

  it(`limita a ${MAX_TITLE_LENGTH} caracteres`, () => {
    const id = store().create();
    store().rename(id, "x".repeat(100));
    expect(store().tabs[0].title).toHaveLength(MAX_TITLE_LENGTH);
  });

  it("título do shell é usado enquanto não há nome manual", () => {
    const id = store().create();
    store().setShellTitle(id, "vim arquivo.txt");
    expect(store().tabs[0].title).toBe("vim arquivo.txt");
  });
});

describe("fechar", () => {
  it("ativa a aba vizinha ao fechar a ativa", () => {
    const a = store().create();
    const b = store().create();
    const c = store().create();
    store().activate(b);
    store().close(b);
    expect(store().activeId).toBe(c);
    store().close(c);
    expect(store().activeId).toBe(a);
    store().close(a);
    expect(store().activeId).toBeNull();
  });
});

describe("navegar e mover", () => {
  it("próxima/anterior dão a volta", () => {
    const a = store().create();
    store().create();
    const c = store().create();
    store().activateRelative(1);
    expect(store().activeId).toBe(a);
    store().activateRelative(-1);
    expect(store().activeId).toBe(c);
  });

  it("ir para índice e para a última", () => {
    const a = store().create();
    const b = store().create();
    store().activateIndex(0);
    expect(store().activeId).toBe(a);
    store().activateIndex(5);
    expect(store().activeId).toBe(a);
    store().activateLast();
    expect(store().activeId).toBe(b);
  });

  it("move a aba ativa sem sair dos limites", () => {
    const a = store().create();
    const b = store().create();
    store().activate(a);
    store().moveActive(1);
    expect(store().tabs.map((t) => t.id)).toEqual([b, a]);
    store().moveActive(1);
    expect(store().tabs.map((t) => t.id)).toEqual([b, a]);
  });
});

describe("reiniciar", () => {
  it("incrementa a geração e mantém nome manual", () => {
    const id = store().create();
    store().rename(id, "Build");
    store().setRunning(id, "pty-1");
    expect(store().tabs[0]).toMatchObject({ status: "running", sessionId: "pty-1" });
    store().setExited(id, 1);
    expect(store().tabs[0]).toMatchObject({ status: "exited", sessionId: null, exitCode: 1 });
    store().restart(id);
    expect(store().tabs[0]).toMatchObject({
      title: "Build",
      status: "starting",
      exitCode: null,
      generation: 1,
    });
  });
});
