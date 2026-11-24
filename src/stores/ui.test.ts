import { beforeEach, describe, expect, it } from "vitest";
import { isModalOpen, useUi } from "./ui";

const request = { title: "t", message: "m", confirmLabel: "ok", cancelLabel: "no" };

beforeEach(() => useUi.setState({ settingsOpen: false, confirm: null }));

describe("confirmação", () => {
  it("resolve com a resposta do usuário", async () => {
    const answer = useUi.getState().askConfirm(request);
    expect(isModalOpen()).toBe(true);
    useUi.getState().answerConfirm(true);
    await expect(answer).resolves.toBe(true);
    expect(isModalOpen()).toBe(false);
  });

  it("uma nova pergunta cancela a anterior", async () => {
    const first = useUi.getState().askConfirm(request);
    const second = useUi.getState().askConfirm(request);
    await expect(first).resolves.toBe(false);
    useUi.getState().answerConfirm(true);
    await expect(second).resolves.toBe(true);
  });
});
