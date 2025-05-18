import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/modal.css';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create the modal container if it doesn't exist
    let modalContainer = document.getElementById('modal-root');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.setAttribute('id', 'modal-root');
      document.body.appendChild(modalContainer);
    }
    
    setModalRoot(modalContainer);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Don't render if modal is closed or if modalRoot is not available
  if (!isOpen || !modalRoot) return null;
  
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default BaseModal; 