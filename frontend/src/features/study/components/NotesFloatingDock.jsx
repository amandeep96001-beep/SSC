import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, StickyNote, X, GripVertical } from 'lucide-react';
import { prepareNotesHtml } from '@/shared/utils/notesMarkup';
import { StickyNotesPanel } from './StickyNotesPanel';
import { stickyCountForTopic } from '../stickyNotesStorage';
import { loadFabPosition, saveFabPosition, getTopicNotesHtml } from '../notesFloatingStorage';
import '../notes-floating-dock.css';

const DRAG_THRESHOLD = 6;

export function NotesFloatingDock({
  topicId,
  topicName,
  notesHtml: notesHtmlProp,
  serverNotes,
  enabled = true,
  openSignal = 0,
  openSignalTab = 'read',
  lockBodyScroll = true
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('read');
  const [pos, setPos] = useState(loadFabPosition);
  const [stickyCount, setStickyCount] = useState(0);
  const [dragging, setDragging] = useState(false);
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

  const notesHtml = notesHtmlProp || getTopicNotesHtml(topicId, serverNotes, prepareNotesHtml);

  useEffect(() => {
    if (topicId) setStickyCount(stickyCountForTopic(topicId));
  }, [topicId, open]);

  useEffect(() => {
    if (!openSignal) return;
    setTab(openSignalTab);
    setOpen(true);
  }, [openSignal, openSignalTab]);

  useEffect(() => {
    if (!open || !lockBodyScroll) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, lockBodyScroll]);

  const clampPercent = useCallback((x, y) => ({
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(94, Math.max(6, y))
  }), []);

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
    const next = clampPercent(
      dragState.current.originX + (dx / vw) * 100,
      dragState.current.originY + (dy / vh) * 100
    );
    setPos(next);
  }, [clampPercent]);

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
    if (topicId) setStickyCount(stickyCountForTopic(topicId));
  }, [topicId]);

  if (!enabled || !topicId) return null;

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
        aria-label={open ? 'Drag notes button' : 'Open revision notes and stickies'}
        aria-expanded={open}
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
      >
        <GripVertical size={14} className="notes-fab__grip" aria-hidden />
        <BookOpen size={22} className="notes-fab__icon" aria-hidden />
        {stickyCount > 0 && (
          <span className="notes-fab__badge" aria-hidden>{stickyCount}</span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="notes-fab-backdrop" aria-label="Close notes" onClick={closePanel} />
          <div
            className={`notes-fab-panel${pos.y > 55 ? ' notes-fab-panel--above' : ' notes-fab-panel--below'}`}
            style={fabStyle}
            role="dialog"
            aria-label="Quick notes reader"
          >
            <header className="notes-fab-panel__header">
              <div>
                <p className="notes-fab-panel__eyebrow">Quick access</p>
                <h3>{topicName || 'Topic notes'}</h3>
              </div>
              <button type="button" className="notes-fab-panel__close" onClick={closePanel} aria-label="Close">
                <X size={18} />
              </button>
            </header>

            <div className="notes-fab-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'read'}
                className={`notes-fab-tab${tab === 'read' ? ' active' : ''}`}
                onClick={() => setTab('read')}
              >
                <BookOpen size={14} /> Read notes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'stickies'}
                className={`notes-fab-tab${tab === 'stickies' ? ' active' : ''}`}
                onClick={() => setTab('stickies')}
              >
                <StickyNote size={14} /> Stickies{stickyCount > 0 ? ` (${stickyCount})` : ''}
              </button>
            </div>

            <div className="notes-fab-panel__body">
              {tab === 'read' ? (
                <div
                  className="notes-fab-reader"
                  dangerouslySetInnerHTML={{ __html: notesHtml }}
                />
              ) : (
                <StickyNotesPanel
                  variant="embedded"
                  topicId={topicId}
                  topicName={topicName}
                  open
                  onClose={closePanel}
                  onCountChange={setStickyCount}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
