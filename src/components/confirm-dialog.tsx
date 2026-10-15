"use client";

import { useUI } from "@/store/ui";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function ConfirmDialog() {
  const confirm = useUI((s) => s.confirm);
  const closeConfirm = useUI((s) => s.closeConfirm);

  const handleConfirm = () => {
    confirm?.onConfirm();
    closeConfirm();
  };

  return (
    <Modal open={Boolean(confirm)} onClose={closeConfirm} labelledBy="confirm-title">
      {confirm ? (
        <>
          <h2 id="confirm-title" className="text-base font-semibold text-ink">
            {confirm.title}
          </h2>
          {confirm.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {confirm.description}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="h-9 rounded-lg px-3.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                "h-9 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors",
                confirm.danger
                  ? "bg-danger hover:brightness-110"
                  : "bg-accent text-accent-ink hover:brightness-110",
              )}
            >
              {confirm.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
