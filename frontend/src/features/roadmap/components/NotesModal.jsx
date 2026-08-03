import { useEffect, useState } from 'react';
import { X, StickyNote } from 'lucide-react';

/**
 * Lightweight notes modal for a topic.
 */
export function NotesModal({ topic, notes, onSave, onClose }) {
  const [value, setValue] = useState(notes || '');

  useEffect(() => {
    setValue(notes || '');
  }, [notes, topic?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!topic) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content-card roadmap-notes-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-notes-title"
      >
        <div className="modal-header">
          <div className="roadmap-notes-modal__heading">
            <StickyNote size={18} aria-hidden />
            <h3 id="roadmap-notes-title">Notes · {topic.name}</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-form">
          <label htmlFor="roadmap-notes-input" className="sr-only">
            Topic notes
          </label>
          <textarea
            id="roadmap-notes-input"
            className="roadmap-notes-textarea"
            rows={8}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Formulas, tricks, weak areas, PYQ links…"
            autoFocus
          />
          <div className="roadmap-notes-modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-save-topic"
              onClick={() => {
                onSave(topic.id, value);
                onClose();
              }}
            >
              Save notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
