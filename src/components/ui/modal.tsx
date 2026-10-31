import React, { useEffect } from 'react';

const sizes = {
  md: 'max-w-md',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

export interface ModalProps {
  onClose: () => void;
  size?: keyof typeof sizes;
  children: React.ReactNode;
}

/** One dialog shell for every modal: quiet backdrop, Escape to close, click outside to close. */
export function Modal({ onClose, size = 'xl', children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`modal-enter relative max-h-[90vh] w-full ${sizes[size]} overflow-y-auto rounded-2xl border border-white/8 bg-zinc-900 p-6 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]`}
      >
        {children}
      </div>
    </div>
  );
}
