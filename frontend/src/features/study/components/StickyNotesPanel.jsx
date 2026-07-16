import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Plus, Trash2, X, Pin } from 'lucide-react';
import {
  STICKY_COLORS,
  loadStickies,
  saveStickies
} from '../stickyNotesStorage';

export function StickyNotesPanel({
  topicId,
  topicName,
  open,
  onClose,
  onCountChange,
  variant = 'sheet'
}) {
  const [stickies, setStickies] = useState(() => loadStickies(topicId));
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState('yellow');

  useEffect(() => {
    setStickies(loadStickies(topicId));
    setDraft('');
    setDraftColor('yellow');
  }, [topicId]);

  useEffect(() => {
    if (!open || variant === 'embedded') return undefined;
    document.documentElement.classList.add('sticky-sheet-open');
    return () => document.documentElement.classList.remove('sticky-sheet-open');
  }, [open, variant]);

  const persist = useCallback((next) => {
    setStickies(next);
    saveStickies(topicId, next);
    onCountChange?.(next.length);
  }, [topicId, onCountChange]);

  const addSticky = () => {
    const text = draft.trim();
    if (!text) return;
    const next = [
      {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        color: draftColor,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      ...stickies
    ];
    persist(next);
    setDraft('');
  };

  const updateText = (id, text) => {
    persist(stickies.map((s) => (
      s.id === id ? { ...s, text, updatedAt: Date.now() } : s
    )));
  };

  const setColor = (id, color) => {
    persist(stickies.map((s) => (
      s.id === id ? { ...s, color, updatedAt: Date.now() } : s
    )));
  };

  const togglePin = (id) => {
    persist(
      [...stickies]
        .map((s) => (s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
    );
  };

  const removeSticky = (id) => {
    persist(stickies.filter((s) => s.id !== id));
  };

  if (!open) return null;

  const sorted = [...stickies].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
  );

  const panelBody = (
    <aside className={`sticky-panel${variant === 'embedded' ? ' sticky-panel--embedded' : ' sticky-panel--sheet'}`} aria-label="Sticky notes">
        <header className="sticky-panel__header">
          <div>
            <p className="sticky-panel__eyebrow">
              <StickyNote size={14} aria-hidden /> Sticky notes
            </p>
            <h3>{topicName || 'This topic'}</h3>
            <p className="sticky-panel__hint">Quick reminders — saved on this device.</p>
          </div>
          <button type="button" className="sticky-panel__close" onClick={onClose} aria-label="Close sticky notes">
            <X size={18} />
          </button>
        </header>

        <div className="sticky-compose">
          <textarea
            className="sticky-compose__input"
            rows={3}
            placeholder="Jot a formula, trick, or doubt…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                addSticky();
              }
            }}
          />
          <div className="sticky-compose__row">
            <div className="sticky-color-row" role="group" aria-label="Sticky color">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`sticky-color-dot sticky-color-dot--${c}${draftColor === c ? ' active' : ''}`}
                  onClick={() => setDraftColor(c)}
                  title={c}
                  aria-label={c}
                />
              ))}
            </div>
            <button type="button" className="sticky-compose__add" onClick={addSticky} disabled={!draft.trim()}>
              <Plus size={15} /> Add
            </button>
          </div>
        </div>

        <div className="sticky-list">
          {sorted.length === 0 ? (
            <div className="sticky-empty">
              <StickyNote size={28} strokeWidth={1.5} />
              <p>No stickies yet. Capture shortcuts while you read.</p>
            </div>
          ) : (
            sorted.map((s) => (
              <div key={s.id} className={`sticky-card sticky-card--${s.color}${s.pinned ? ' sticky-card--pinned' : ''}`}>
                <div className="sticky-card__tools">
                  <button
                    type="button"
                    className={`sticky-icon-btn${s.pinned ? ' active' : ''}`}
                    onClick={() => togglePin(s.id)}
                    title={s.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    type="button"
                    className="sticky-icon-btn danger"
                    onClick={() => removeSticky(s.id)}
                    title="Delete sticky"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="sticky-card__text"
                  value={s.text}
                  rows={Math.min(8, Math.max(2, s.text.split('\n').length + 1))}
                  onChange={(e) => updateText(s.id, e.target.value)}
                />
                <div className="sticky-color-row sticky-color-row--sm">
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`sticky-color-dot sticky-color-dot--${c}${s.color === c ? ' active' : ''}`}
                      onClick={() => setColor(s.id, c)}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </aside>
  );

  if (variant === 'embedded') {
    return panelBody;
  }

  return (
    <>
      <button type="button" className="sticky-backdrop" aria-label="Close sticky notes" onClick={onClose} />
      {panelBody}
    </>
  );
}
