import { useEffect } from "react";
import "./othello.css";

export const DialogBox = ({ isOpen, onClose, title, content, onConfirm }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-content">{content}</p>
        <div className="dialog-actions">
          <button className="button" onClick={onClose}>Cancel</button>
          <button className="button primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};
