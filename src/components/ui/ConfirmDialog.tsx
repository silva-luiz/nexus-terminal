import { useUi } from "../../stores/ui";
import { Modal } from "./Modal";

export function ConfirmDialog() {
  const confirm = useUi((s) => s.confirm);
  const answer = useUi((s) => s.answerConfirm);
  if (!confirm) return null;

  return (
    <Modal
      title={confirm.title}
      onClose={() => answer(false)}
      className="modal--confirm"
      initialFocus=".button--danger"
    >
      <h2 className="modal__title">{confirm.title}</h2>
      <p className="modal__message">{confirm.message}</p>
      <div className="modal__actions">
        <button type="button" className="button" onClick={() => answer(false)}>
          {confirm.cancelLabel}
        </button>
        <button type="button" className="button button--danger" onClick={() => answer(true)}>
          {confirm.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
