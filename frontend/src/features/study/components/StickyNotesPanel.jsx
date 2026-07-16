import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Plus, Trash2, Pin } from 'lucide-react';
import {
  STICKY_COLORS,
  loadDailyStickies,
  saveDailyStickies
} from '../stickyNotesStorage';

function makeId() {
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const StickyNotesPanel = forwardRef(function StickyNotesPanel({
  open,
  onCountChange
}, ref) {
  const [notes, setNotes] = useState(() => loadDailyStickies());
  const [draft, setDraft] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const [draftColor, setDraftColor] = useState('yellow');
  const composeRef = useRef(null);

  const syncCount = useCallback((list) => {
    onCountChange?.(list.filter((n) => n.text?.trim()).length);
  }, [onCountChange]);

  useEffect(() => {
    if (!open) return;
    const list = loadDailyStickies();
    setNotes(list);
    syncCount(list);
  }, [open, syncCount]);

  const persist = useCallback((next) => {
    setNotes(next);
    saveDailyStickies(next);
    syncCount(next);
  }, [syncCount]);

  const saveDraft = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      composeRef.current?.focus();
      return;
    }
    const note = {
      id: makeId(),
      text,
      label: draftLabel.trim() || undefined,
      color: draftColor,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    persist([note, ...notes]);
    setDraft('');
    setDraftLabel('');
    setDraftColor('yellow');
    composeRef.current?.focus();
  }, [draft, draftLabel, draftColor, notes, persist]);

  const focusCompose = useCallback(() => {
    composeRef.current?.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    addNewNote: focusCompose,
    focusCompose
  }), [focusCompose]);

  const updateText = (id, text) => {
    persist(notes.map((s) => (
      s.id === id ? { ...s, text, updatedAt: Date.now() } : s
    )));
  };

  const updateLabel = (id, label) => {
    persist(notes.map((s) => (
      s.id === id ? { ...s, label, updatedAt: Date.now() } : s
    )));
  };

  const finalizeLabel = (id, label) => {
    const trimmed = label.trim();
    persist(notes.map((s) => (
      s.id === id ? { ...s, label: trimmed || undefined, updatedAt: Date.now() } : s
    )));
  };

  const setColor = (id, color) => {
    persist(notes.map((s) => (
      s.id === id ? { ...s, color, updatedAt: Date.now() } : s
    )));
  };

  const togglePin = (id) => {
    persist(
      [...notes]
        .map((s) => (s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
    );
  };

  const removeNote = (id) => {
    persist(notes.filter((s) => s.id !== id));
  };

  if (!open) return null;

  const sorted = [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
  );

  return (
    <div className="qn-panel">
      <div className="qn-compose">
        <div className={`qn-compose__sheet qn-compose__sheet--${draftColor}`}>
          <input
            type="text"
            className="qn-compose__label"
            placeholder="Label (optional)"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            spellCheck={false}
          />
          <textarea
            ref={composeRef}
            className="qn-compose__body"
            placeholder="Tomorrow’s topic, formula, reminder…"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                saveDraft();
              }
            }}
            spellCheck={false}
          />
        </div>
        <div className="qn-compose__bar">
          <div className="qn-compose__colors" role="group" aria-label="Color">
            {STICKY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`qn-swatch qn-swatch--${c}${draftColor === c ? ' is-on' : ''}`}
                onClick={() => setDraftColor(c)}
                aria-label={c}
                aria-pressed={draftColor === c}
              />
            ))}
          </div>
          <button
            type="button"
            className="qn-compose__save"
            onClick={saveDraft}
            disabled={!draft.trim()}
          >
            <Plus size={15} /> Save
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="qn-empty">
          <p>No quick notes yet</p>
          <span>Daily scratchpad — not topic study notes. Type above and Save.</span>
        </div>
      ) : (
        <ul className="qn-list">
          {sorted.map((s) => (
            <li key={s.id} className={`qn-item qn-item--${s.color}${s.pinned ? ' qn-item--pinned' : ''}`}>
              <div className="qn-item__top">
                <span className={`qn-item__dot qn-item__dot--${s.color}`} aria-hidden />
                <input
                  type="text"
                  className="qn-item__label"
                  placeholder="Add a label"
                  value={s.label ?? ''}
                  onChange={(e) => updateLabel(s.id, e.target.value)}
                  onBlur={(e) => finalizeLabel(s.id, e.target.value)}
                  spellCheck={false}
                />
                <div className="qn-item__actions">
                  <button
                    type="button"
                    className={`qn-item__action${s.pinned ? ' is-on' : ''}`}
                    onClick={() => togglePin(s.id)}
                    title={s.pinned ? 'Unpin' : 'Pin'}
                    aria-label={s.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={13} />
                  </button>
                  <button
                    type="button"
                    className="qn-item__action qn-item__action--del"
                    onClick={() => removeNote(s.id)}
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <textarea
                className="qn-item__body"
                value={s.text}
                rows={Math.min(6, Math.max(2, (s.text || '').split('\n').length + 1))}
                onChange={(e) => updateText(s.id, e.target.value)}
                spellCheck={false}
              />

              <div className="qn-item__colors" role="group" aria-label="Color">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`qn-swatch qn-swatch--${c}${s.color === c ? ' is-on' : ''}`}
                    onClick={() => setColor(s.id, c)}
                    aria-label={c}
                    aria-pressed={s.color === c}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
