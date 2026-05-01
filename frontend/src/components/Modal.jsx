import { createPortal } from "react-dom";

const Modal = ({ children, onClose, className = "" }) => {
  const modalClassName = className ? `modal ${className}` : "modal";
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={modalClassName} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
