import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  onClose: () => void;
  /** Accessible name for the dialog */
  label: string;
  /** Tailwind max-width class, e.g. "max-w-2xl" */
  widthClass?: string;
  children: React.ReactNode;
}

/**
 * Native <dialog> modal: focus trap, Esc-to-close, inert background and
 * top-layer stacking come from the browser instead of hand-rolled overlays.
 */
export function Modal({ onClose, label, widthClass = 'max-w-2xl', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`ng-dialog w-[calc(100vw-2rem)] ${widthClass}`}
      onClose={onClose}
      onClick={(e) => {
        // click on the backdrop (the dialog element itself) dismisses
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="p-6">{children}</div>
    </dialog>
  );
}
