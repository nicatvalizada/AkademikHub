import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root animate-fade-in" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div className="modal-dialog animate-slide-up" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
