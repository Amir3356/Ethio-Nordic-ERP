import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface UserModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function UserModal({ title, onClose, children }: UserModalProps) {
  return createPortal(
    <div className="content-modal-backdrop" onClick={onClose}>
      <div className="content-modal" onClick={(e) => e.stopPropagation()}>
        <div className="content-modal-header">
          <h3>{title}</h3>
          <button type="button" className="content-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="content-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
