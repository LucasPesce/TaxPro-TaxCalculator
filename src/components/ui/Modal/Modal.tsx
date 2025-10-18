//================= IMPORTACIONES =================
import React, { type ReactNode } from 'react';
import styles from './Modal.module.css';

//=========== DEFINICIÓN DE PROPIEDADES ============
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

//=============== COMPONENTE MODAL =================
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </header>

        <main className={styles.body}>
          {children}
        </main>
        
        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
        
      </div>
    </div>
  );
};