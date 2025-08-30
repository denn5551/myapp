import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

/** Welcome popup shown on first dashboard visit */
export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('welcomePopupDismissed')) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem('welcomePopupDismissed', 'true');
    }
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Добро пожаловать!</h2>
        <p className="mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={() => setDontShow(!dontShow)}
            className="mr-2"
          />
          Больше не показывать
        </label>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
}
