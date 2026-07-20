import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StickyNote, X, GripVertical, Plus } from 'lucide-react';
import { StickyNotesPanel } from './StickyNotesPanel';
import { dailyStickyCount } from '../stickyNotesStorage';
import { loadFabPosition, saveFabPosition, clampFabPos } from '../notesFloatingStorage';
import '../notes-floating-dock.css';

const DRAG_THRESHOLD = 6;

export function NotesFloatingDock({
  enabled = true,
  openSignal = 0,
  lockBodyScroll = true
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(loadFabPosition);
  const [noteCount, setNoteCount] = useState(() => dailyStickyCount());
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  const dragState = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });

  const refreshCount = useCallback(() => {
    setNoteCount(dailyStickyCount());
  }, []);

  useEffect(() => {
    if (open) refreshCount();
  }, [open, refreshCount]);

  useEffect(() => {
    if (!openSignal) return;
    setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    if (!open || !lockBodyScroll) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, lockBodyScroll]);

  // Close panel on Android hardware back (popstate) when open
  useEffect(() => {
    if (!open) return undefined;
    const onPopState = () => {
      setOpen(false);
      refreshCount();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        refreshCount();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, refreshCount]);

  const onFabPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragState.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos.x, pos.y]);

  const onFabPointerMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
    }
    if (!dragState.current.moved) return;

    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const next = clampFabPos({
      x: dragState.current.originX + (dx / vw) * 100,
      y: dragState.current.originY + (dy / vh) * 100
    });
    setPos(next);
  }, []);

  const onFabPointerUp = useCallback((e) => {
    if (!dragState.current.active) return;
    const wasDrag = dragState.current.moved;
    dragState.current.active = false;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }

    if (wasDrag) {
      saveFabPosition(posRef.current);
    } else {
      setOpen((v) => !v);
    }
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    refreshCount();
  }, [refreshCount]);

  const handleAdd = () => {
    panelRef.current?.focusCompose?.();
  };

  if (!enabled) return null;

  const fabStyle = {
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: 'translate(-50%, -50%)'
  };

  const panel = (
    <>
      <button
        type="button"
        className={`notes-fab${open ? ' notes-fab--open' : ''}${dragging ? ' notes-fab--dragging' : ''}`}
        style={fabStyle}
        aria-label={open ? 'Drag Quick Notes button' : 'Open Quick Notes'}
        aria-expanded={open}
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
      >
        <GripVertical size={12} className="notes-fab__grip" aria-hidden />
        <StickyNote size={20} className="notes-fab__icon" aria-hidden />
        {noteCount > 0 && (
          <span className="notes-fab__badge" aria-hidden>{noteCount}</span>
        )}
      </button>

      {open && (
        <div className="notes-fab-modal-layer">
          <button type="button" className="notes-fab-backdrop" aria-label="Close Quick Notes" onClick={closePanel} />
          <div className="notes-fab-modal" role="dialog" aria-label="Quick Notes" aria-modal="true">
            <header className="notes-fab-modal__header">
              <div className="notes-fab-modal__title">
                <h3>Quick Notes</h3>
                <p>Scratchpad · saved on this device</p>
              </div>
              <div className="notes-fab-modal__actions">
                <button type="button" className="notes-fab-modal__add" onClick={handleAdd} title="Focus composer" aria-label="New note">
                  <Plus size={18} />
                </button>
                <button type="button" className="notes-fab-modal__close" onClick={closePanel} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="notes-fab-modal__body">
              <StickyNotesPanel
                ref={panelRef}
                open
                onCountChange={setNoteCount}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
