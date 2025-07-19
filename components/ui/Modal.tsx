import React from 'react';

/** Props for Modal component */
export interface ModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when overlay or close action triggered */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
}

/**
 * Simple overlay modal.
 */
export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
