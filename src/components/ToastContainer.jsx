/**
 * ToastContainer.jsx — Renders floating toast notifications.
 */
import { createPortal } from 'react-dom';

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{t.emoji}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
