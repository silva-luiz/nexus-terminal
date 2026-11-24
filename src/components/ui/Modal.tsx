import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  title: string;
  onClose(): void;
  children: ReactNode;
  className?: string;
  /** Elemento que recebe o foco ao abrir (seletor CSS dentro do diálogo). */
  initialFocus?: string;
}

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Diálogo modal: fecha com Esc ou clique fora, e mantém o Tab dentro dele. */
export function Modal({ title, onClose, children, className, initialFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const target =
      (initialFocus && el?.querySelector<HTMLElement>(initialFocus)) ||
      el?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  }, [initialFocus]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
          if (event.key === "Tab" && ref.current) {
            const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
