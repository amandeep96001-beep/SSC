import { useState, useRef, useCallback, useEffect } from 'react';
import { prepareNotesHtml } from '@/shared/utils/notesMarkup';
import { getSubjectVisual } from '@/shared/utils/subjectVisuals';
import { 
  BookMarked, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  ClipboardList,
  Highlighter,
  Pencil,
  Save,
  X,
  Eraser,
  List,
  Eye,
  ArrowUp,
  ArrowLeft,
  Search,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  AlignJustify,
  Settings2,
  NotebookPen,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  ListOrdered,
  Copy,
  Download,
  RotateCcw,
  Bookmark
} from 'lucide-react';

export function SyllabusWorkspace({
  activeView,
  setActiveView,
  contentSource,
  setContentSource,
  isMineMode,
  subjects,
  selectSubject,
  selectedSubject,
  topicsList,
  selectTopic,
  user,
  setModalOpen,
  setSubjectModalOpen,
  handleOpenEditModal,
  handleDeleteClick,
  handleDeleteSubjectClick,
  activeNotes,
  startTest,
  updateCustomTopic,
  onOpenNotesDock
}) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [localNotesHtml, setLocalNotesHtml] = useState(() => {
    if (!activeNotes) return '';
    const stored = localStorage.getItem(`ssc_notes_${activeNotes.id}`);
    return prepareNotesHtml(stored || activeNotes.notes || '');
  });
  const [prevActiveNotes, setPrevActiveNotes] = useState(activeNotes);
  const notesRef = useRef(null);
  const notesScrollRef = useRef(null);

  const [notesFontSize, setNotesFontSize] = useState(() => localStorage.getItem('ssc_notes_font') || 'lg');
  const [notesComfort, setNotesComfort] = useState(() => localStorage.getItem('ssc_notes_comfort') === '1');
  const [notesLineSpacing, setNotesLineSpacing] = useState(() => localStorage.getItem('ssc_notes_spacing') || 'relaxed');
  const [notesFocus, setNotesFocus] = useState(false);
  const [showReadTools, setShowReadTools] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [tocItems, setTocItems] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);
  const [searchMatchCount, setSearchMatchCount] = useState(0);
  const searchHitsRef = useRef([]);
  const [bookmarks, setBookmarks] = useState(() => {
    if (!activeNotes?.id) return [];
    try {
      const bm = localStorage.getItem(`ssc_bookmarks_${activeNotes.id}`);
      return bm ? JSON.parse(bm) : [];
    } catch {
      return [];
    }
  });
  const [manageFlash, setManageFlash] = useState('');

  if (activeNotes !== prevActiveNotes) {
    setPrevActiveNotes(activeNotes);
    const stored = activeNotes ? localStorage.getItem(`ssc_notes_${activeNotes.id}`) : null;
    setLocalNotesHtml(prepareNotesHtml(stored || activeNotes?.notes || ''));
    setReadingProgress(0);
    setShowScrollTop(false);
    setSearchQuery('');
    setSearchMatchIdx(0);
    setSearchMatchCount(0);
    searchHitsRef.current = [];
    setIsEditingNotes(false);
    setManageFlash('');
    try {
      const bm = activeNotes ? localStorage.getItem(`ssc_bookmarks_${activeNotes.id}`) : null;
      setBookmarks(bm ? JSON.parse(bm) : []);
    } catch {
      setBookmarks([]);
    }
  }

  useEffect(() => {
    localStorage.setItem('ssc_notes_font', notesFontSize);
  }, [notesFontSize]);

  useEffect(() => {
    localStorage.setItem('ssc_notes_comfort', notesComfort ? '1' : '0');
  }, [notesComfort]);

  useEffect(() => {
    localStorage.setItem('ssc_notes_spacing', notesLineSpacing);
  }, [notesLineSpacing]);

  useEffect(() => {
    if (!notesRef.current || activeView !== 'notes') return;
    const headings = notesRef.current.querySelectorAll('h2, h3, .notes-section-title');
    const items = [];
    headings.forEach((el, i) => {
      const id = `note-sec-${activeNotes?.id || 'x'}-${i}`;
      el.id = id;
      items.push({
        id,
        text: (el.textContent || '').trim().slice(0, 72),
        level: el.tagName === 'H3' ? 3 : 2
      });
    });
    setTocItems(items);
  }, [localNotesHtml, activeNotes, activeView]);

  const handleNotesScroll = useCallback(() => {
    const el = notesScrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0;
    setReadingProgress(pct);
    setShowScrollTop(el.scrollTop > 200);
    if (activeNotes?.id) {
      localStorage.setItem(`ssc_notes_scroll_${activeNotes.id}`, String(el.scrollTop));
    }
  }, [activeNotes?.id]);

  const scrollToSection = useCallback((id) => {
    const target = document.getElementById(id);
    const container = notesScrollRef.current;
    if (!target || !container) return;
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 12;
    container.scrollTo({ top: offset, behavior: 'smooth' });
  }, []);

  const clearSearchHighlights = useCallback(() => {
    if (!notesRef.current) return;
    notesRef.current.querySelectorAll('mark.search-hit').forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
  }, []);

  const collectSearchHits = useCallback(() => {
    const root = notesRef.current;
    if (!root || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const hits = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      let start = 0;
      let idx;
      while ((idx = text.toLowerCase().indexOf(q, start)) !== -1) {
        hits.push({ node, start, end: idx + q.length });
        start = idx + q.length;
      }
    }
    return hits;
  }, [searchQuery]);

  const jumpToHit = useCallback((idx) => {
    clearSearchHighlights();
    const hits = searchHitsRef.current;
    const container = notesScrollRef.current;
    if (!hits.length || !container || idx < 0 || idx >= hits.length) return;

    setSearchMatchIdx(idx);
    const hit = hits[idx];
    if (!hit?.node?.parentNode) return;

    try {
      const range = document.createRange();
      range.setStart(hit.node, hit.start);
      range.setEnd(hit.node, hit.end);
      const mark = document.createElement('mark');
      mark.className = 'search-hit';
      range.surroundContents(mark);
      const offset = mark.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 16;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    } catch {
      hit.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clearSearchHighlights]);

  const goToSearchMatch = useCallback((direction = 1) => {
    let hits = searchHitsRef.current;
    if (!hits.length && searchQuery.trim()) {
      hits = collectSearchHits();
      searchHitsRef.current = hits;
      setSearchMatchCount(hits.length);
    }
    if (!hits.length) return;
    const base = searchMatchIdx < 0 ? 0 : searchMatchIdx;
    const nextIdx = direction >= 0
      ? (base + 1) % hits.length
      : (base - 1 + hits.length) % hits.length;
    jumpToHit(nextIdx);
  }, [collectSearchHits, jumpToHit, searchMatchIdx, searchQuery]);

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault();
    clearSearchHighlights();
    const hits = collectSearchHits();
    searchHitsRef.current = hits;
    setSearchMatchCount(hits.length);
    if (hits.length) jumpToHit(0);
    else setSearchMatchIdx(0);
  }, [clearSearchHighlights, collectSearchHits, jumpToHit]);

  useEffect(() => {
    if (activeView !== 'notes' || !activeNotes?.id) return;
    const el = notesScrollRef.current;
    if (!el) return;
    const saved = localStorage.getItem(`ssc_notes_scroll_${activeNotes.id}`);
    requestAnimationFrame(() => {
      if (saved) el.scrollTop = parseInt(saved, 10) || 0;
      handleNotesScroll();
    });
  }, [activeNotes?.id, activeView, localNotesHtml, handleNotesScroll]);

  useEffect(() => {
    clearSearchHighlights();
    searchHitsRef.current = [];
    setSearchMatchCount(0);
    setSearchMatchIdx(0);
  }, [searchQuery, localNotesHtml, clearSearchHighlights]);

  const scrollNotesToTop = useCallback(() => {
    notesScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditToggle = () => {
    setIsEditingNotes(prev => !prev);
  };

  const persistNotesHtml = useCallback(async (newHtml, { closeEditor = false } = {}) => {
    if (!activeNotes?.id) return { success: false };
    localStorage.setItem(`ssc_notes_${activeNotes.id}`, newHtml);
    setLocalNotesHtml(newHtml);

    // Official syllabus is read-only on server; personal edits stay local
    if (!activeNotes.isOwned) {
      if (closeEditor) setIsEditingNotes(false);
      return { success: true, localOnly: true };
    }

    const res = await updateCustomTopic(activeNotes.id, {
      name: activeNotes.name,
      notes: newHtml,
      questions: []
    });
    if (res.success && closeEditor) setIsEditingNotes(false);
    return res;
  }, [activeNotes, updateCustomTopic]);

  const handleSaveNotes = useCallback(async () => {
    if (!notesRef.current) return;
    setIsSaving(true);
    const newHtml = notesRef.current.innerHTML;
    const res = await persistNotesHtml(newHtml, { closeEditor: true });
    setIsSaving(false);
    if (!res.success) {
      alert(res.message || 'Failed to save notes');
    }
  }, [persistNotesHtml]);

  const handleHighlight = useCallback(async (color) => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = `hl-${color}`;

    try {
      range.surroundContents(mark);
      selection.removeAllRanges();
      if (notesRef.current) {
        await persistNotesHtml(notesRef.current.innerHTML);
      }
    } catch {
      alert('Please select text within a single line to highlight.');
    }
  }, [persistNotesHtml]);

  const handleRemoveHighlight = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      alert('Please click inside or select the highlighted text you want to remove.');
      return;
    }

    let node = selection.anchorNode;
    while (node && node.nodeName !== 'MARK' && node.id !== 'notes-content-view') {
      node = node.parentNode;
    }

    if (node && node.nodeName === 'MARK') {
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);

      if (notesRef.current) {
        await persistNotesHtml(notesRef.current.innerHTML);
      }
    } else {
      alert('Please click inside an existing highlight to remove it.');
    }
  }, [persistNotesHtml]);

  const runFormat = useCallback((command, value = null) => {
    if (!isEditingNotes || !notesRef.current) return;
    notesRef.current.focus();
    try {
      document.execCommand(command, false, value);
    } catch {
      // older browsers / unsupported command
    }
  }, [isEditingNotes]);

  const flashManage = useCallback((msg) => {
    setManageFlash(msg);
    setTimeout(() => setManageFlash(''), 1800);
  }, []);

  const handleCopyNotes = useCallback(async () => {
    const text = notesRef.current?.innerText || activeNotes?.notes || '';
    try {
      await navigator.clipboard.writeText(text);
      flashManage('Notes copied');
    } catch {
      flashManage('Copy failed');
    }
    setShowActionsMenu(false);
  }, [activeNotes, flashManage]);

  const handleExportNotes = useCallback(() => {
    const text = notesRef.current?.innerText || activeNotes?.notes || '';
    const blob = new Blob([`# ${activeNotes?.name || 'Notes'}\n\n${text}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeNotes?.name || 'notes').replace(/[^\w\-]+/g, '_').slice(0, 48)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    flashManage('Exported as .txt');
    setShowActionsMenu(false);
  }, [activeNotes, flashManage]);

  const handleResetLocalEdits = useCallback(() => {
    if (!activeNotes?.id) return;
    if (!window.confirm('Reset local edits & highlights for this topic? Sticky notes stay.')) return;
    localStorage.removeItem(`ssc_notes_${activeNotes.id}`);
    setLocalNotesHtml(prepareNotesHtml(activeNotes.notes || ''));
    setIsEditingNotes(false);
    flashManage('Local edits reset');
    setShowActionsMenu(false);
  }, [activeNotes, flashManage]);

  const handleAddBookmark = useCallback(() => {
    if (!activeNotes?.id || !notesScrollRef.current) return;
    const scrollTop = notesScrollRef.current.scrollTop;
    const label = `Bookmark @ ${readingProgress}%`;
    const next = [
      { id: `bm-${Date.now()}`, label, scrollTop, createdAt: Date.now() },
      ...bookmarks
    ].slice(0, 8);
    setBookmarks(next);
    localStorage.setItem(`ssc_bookmarks_${activeNotes.id}`, JSON.stringify(next));
    flashManage('Bookmark saved');
  }, [activeNotes, bookmarks, readingProgress, flashManage]);

  const jumpToBookmark = useCallback((bm) => {
    notesScrollRef.current?.scrollTo({ top: bm.scrollTop, behavior: 'smooth' });
  }, []);

  const removeBookmark = useCallback((id) => {
    if (!activeNotes?.id) return;
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    localStorage.setItem(`ssc_bookmarks_${activeNotes.id}`, JSON.stringify(next));
  }, [activeNotes, bookmarks]);

  return (
    <>
      {/* --- VIEW: SUBJECT LISTS --- */}
      {activeView === 'subjects' && (
        <div className="study-workspace syllabus-flow">
          <header className="syllabus-page-header">
            <div className="syllabus-page-header__row">
              <div className="syllabus-page-header__text">
                <h1>Syllabus & Notes</h1>
                <p>
                  {isMineMode
                    ? 'Build your own subjects, topics, notes, and practice questions.'
                    : 'Study from your institute\'s published syllabus for your target exam — notes and topic tests.'}
                </p>
              </div>
              {isMineMode && (
                <div className="syllabus-page-header__actions">
                  <button type="button" className="btn-add" onClick={() => setSubjectModalOpen(true)}>
                    <Plus size={16} /> Add Subject
                  </button>
                </div>
              )}
            </div>

            <div className="content-source-toggle" role="tablist" aria-label="Content source">
              <button
                type="button"
                role="tab"
                aria-selected={contentSource === 'global'}
                className={`content-source-btn${contentSource === 'global' ? ' active' : ''}`}
                onClick={() => setContentSource('global')}
              >
                <BookMarked size={14} strokeWidth={2} /> Official Syllabus
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={contentSource === 'mine'}
                className={`content-source-btn${contentSource === 'mine' ? ' active' : ''}`}
                onClick={() => setContentSource('mine')}
              >
                <NotebookPen size={14} strokeWidth={2} /> My Notes
              </button>
            </div>
          </header>
          <div className="syllabus-page-body">
            {subjects.length > 0 ? (
              <div className="subjects-grid">
                {subjects.map((sub) => {
                  const name = typeof sub === 'string' ? sub : sub.name;
                  const visual = getSubjectVisual(name);
                  return (
                    <div
                      key={name}
                      className={`subject-selection-card subject-selection-card--${visual.tone}`}
                      onClick={() => selectSubject(name)}
                    >
                      <div className={`subject-icon-box subject-icon-box--${visual.tone}`} aria-hidden>
                        <span className="material-symbols-outlined subject-material-icon">
                          {visual.icon}
                        </span>
                      </div>
                      <div className="subject-content">
                        <h3>{name}</h3>
                        <p>
                          {isMineMode
                            ? 'Your custom topics, notes, and practice questions.'
                            : `${visual.label} — open notes and try a timed topic test.`}
                        </p>
                      </div>
                      {isMineMode && (
                        <button
                          type="button"
                          className="btn-topic-action delete subject-delete-btn"
                          title="Delete subject"
                          onClick={(e) => handleDeleteSubjectClick(e, name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <ChevronRight className="arrow-icon" size={18} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-syllabus empty-syllabus--cta">
                {isMineMode ? (
                  <>
                    <p>No personal subjects yet. Create one and add your own topics & questions.</p>
                    <button type="button" className="btn-add" onClick={() => setSubjectModalOpen(true)}>
                      <Plus size={16} /> Create your first subject
                    </button>
                  </>
                ) : (
                  <p>No official subjects for this exam yet. Ask your admin to add subjects for your target exam, or switch exam from the picker.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW: TOPIC LISTS (Under a subject) --- */}
      {activeView === 'topics' && (
        <div className="study-workspace syllabus-flow">
          <header className="syllabus-page-header">
            <div className="syllabus-page-header__row">
              <div className="syllabus-page-header__text">
                <h1>{selectedSubject} — Topics</h1>
                <p>
                  {isMineMode
                    ? 'Add topics with notes and MCQs — fully under your control.'
                    : 'Open a topic for revision notes, then attempt a timed speed test.'}
                </p>
              </div>
              <div className="syllabus-page-header__actions">
                <button type="button" className="btn-back" onClick={() => setActiveView('subjects')}>
                  <ArrowLeft size={16} strokeWidth={2} /> All Subjects
                </button>
                {isMineMode && (
                  <button type="button" className="btn-add" onClick={() => setModalOpen(true)}>
                    <Plus size={16} /> Add Topic
                  </button>
                )}
              </div>
            </div>
          </header>
          <div className="syllabus-page-body">
            <div className="topics-list-container">
            {topicsList.length > 0 ? (
              topicsList.map((topic) => {
                // Look up topic accuracy indicators in user's profile
                const progressRecord = user.progress?.find(p => p.topicId === topic.id);
                const status = progressRecord?.status || 'gray';
                const score = progressRecord?.score;
                const maxScore = progressRecord?.maxScore || 50;
                const canManage = isMineMode && topic.isOwned;

                return (
                  <div 
                    key={topic.id}
                    className="topic-outline-card"
                    onClick={() => selectTopic(topic.id)}
                  >
                    <div className="topic-header-title" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {status !== 'gray' && (
                        <span className={`progress-status-dot ${status}`} title={
                          status === 'green' ? `Mastered (Score: ${score}/${maxScore})` :
                          status === 'yellow' ? `Reviewing (Score: ${score}/${maxScore})` :
                          status === 'red' ? `Action Needed (Score: ${score}/${maxScore})` :
                          'Unattempted'
                        }></span>
                        )}
                        <h3>{topic.name}</h3>
                      </div>
                      {canManage && (
                      <div className="topic-actions-bar" style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '12px' }}>
                        <button 
                          type="button" 
                          className="btn-topic-action edit"
                          onClick={(e) => handleOpenEditModal(e, topic)}
                          title="Edit Notes & Questions"
                          style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-topic-action delete"
                          onClick={(e) => handleDeleteClick(e, topic.id)}
                          title="Delete Topic"
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      )}
                      <ChevronRight className="arrow-icon" size={16} />
                    </div>
                    <p className="topic-desc">{topic.syllabus}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="read-more-tag">Read Study notes & formulas</span>
                      {score !== undefined && (
                        <span className="topic-score-badge">Latest: {score}/{maxScore}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-syllabus empty-syllabus--cta">
                {isMineMode ? (
                  <>
                    <p>No topics in this subject yet. Add notes and practice questions.</p>
                    <button type="button" className="btn-add" onClick={() => setModalOpen(true)}>
                      <Plus size={16} /> Add your first topic
                    </button>
                  </>
                ) : (
                  <p>No active topics are seeded under this subject yet.</p>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW: TOPIC REVISION NOTES & TEST STARTER --- */}
      {activeView === 'notes' && activeNotes && (
        <div className={`study-workspace syllabus-flow notes-flow${notesFocus ? ' notes-flow--focus' : ''}`}>
          {!notesFocus && (
          <header className="syllabus-page-header notes-toolbar-header">
            <div className="syllabus-page-header__row">
              <div className="syllabus-page-header__text">
                <span className="notes-breadcrumb">
                  {activeNotes.isOwned ? 'My Notes' : 'Official Syllabus'} · Revision Notes
                </span>
                <h1>{activeNotes.name}</h1>
                {!activeNotes.isOwned && (
                  <p className="notes-local-hint">Highlights & edits on official notes stay on this device only.</p>
                )}
              </div>
              <div className="syllabus-page-header__actions notes-toolbar-actions">
                <button
                  type="button"
                  className="notes-tool-icon sticky-launch-btn"
                  onClick={() => onOpenNotesDock?.()}
                  title="Quick Notes"
                  aria-label="Quick Notes"
                >
                  <NotebookPen size={18} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className={`notes-tool-icon${showActionsMenu ? ' is-open' : ''}`}
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  title="Actions"
                  aria-label="Actions"
                  aria-expanded={showActionsMenu}
                >
                  <MoreHorizontal size={18} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="notes-tool-icon notes-tool-icon--ghost"
                  onClick={() => { setIsEditingNotes(false); setActiveView('topics'); setShowActionsMenu(false); }}
                  title="Back to topics"
                  aria-label="Back to topics"
                >
                  <ArrowLeft size={18} strokeWidth={1.75} />
                </button>

                {showActionsMenu && (
                  <div className="notes-actions-dropdown">
                    <button type="button" className={`notes-action-btn ${isEditingNotes ? 'active' : ''}`} onClick={() => { handleEditToggle(); }}>
                      {isEditingNotes ? <X size={16} /> : <Pencil size={16} />}
                      {isEditingNotes ? 'Stop Editing' : 'Edit Notes'}
                    </button>
                    {isEditingNotes && (
                      <button type="button" className="notes-action-btn save" onClick={handleSaveNotes} disabled={isSaving}>
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                    <button type="button" className="notes-action-btn" onClick={handleCopyNotes}>
                      <Copy size={16} /> Copy text
                    </button>
                    <button type="button" className="notes-action-btn" onClick={handleExportNotes}>
                      <Download size={16} /> Export .txt
                    </button>
                    <button type="button" className="notes-action-btn" onClick={handleAddBookmark}>
                      <Bookmark size={16} /> Bookmark position
                    </button>
                    <button type="button" className="notes-action-btn" onClick={handleResetLocalEdits}>
                      <RotateCcw size={16} /> Reset local edits
                    </button>
                    <button type="button" className="btn-take-test" onClick={() => { startTest(); setShowActionsMenu(false); }}>
                      <ClipboardList size={16} />
                      Take Topic Test
                    </button>

                    <div className="notes-actions-divider">
                      <span>Highlighter Tools</span>
                      <div className="notes-actions-highlights">
                        <button type="button" className="hl-btn hl-yellow" onClick={() => handleHighlight('yellow')} title="Yellow"><Highlighter size={16}/></button>
                        <button type="button" className="hl-btn hl-green" onClick={() => handleHighlight('green')} title="Green"><Highlighter size={16}/></button>
                        <button type="button" className="hl-btn hl-pink" onClick={() => handleHighlight('pink')} title="Pink"><Highlighter size={16}/></button>
                        <button type="button" className="hl-btn hl-blue" onClick={() => handleHighlight('blue')} title="Blue"><Highlighter size={16}/></button>
                        <button type="button" className="hl-btn hl-clear" onClick={handleRemoveHighlight} title="Remove Highlight"><Eraser size={16}/></button>
                      </div>
                    </div>
                    {manageFlash && <p className="notes-manage-flash">{manageFlash}</p>}
                  </div>
                )}
              </div>
            </div>
          </header>
          )}

          <div className="notes-reader-panel">
              <div className={`notes-reading-toolbar${showReadTools ? ' notes-reading-toolbar--open' : ''}`}>
                <div className="notes-reading-progress" aria-hidden="true">
                  <div className="notes-reading-progress__fill" style={{ width: `${readingProgress}%` }} />
                </div>

                <div className="notes-reading-compact">
                  <span className="notes-reading-compact__meta">{readingProgress}% read</span>
                  <button
                    type="button"
                    className={`notes-tools-toggle${showReadTools ? ' active' : ''}`}
                    onClick={() => setShowReadTools((v) => !v)}
                    aria-expanded={showReadTools}
                  >
                    <Settings2 size={15} />
                    {showReadTools ? 'Hide tools' : 'Read tools'}
                  </button>
                </div>

                <div className="notes-reading-panel">
                  <div className="notes-reading-controls">
                    <span className="notes-reading-controls__label">Read</span>
                    <button type="button" className={`notes-ctrl-btn notes-ctrl-btn--size-sm${notesFontSize === 'sm' ? ' active' : ''}`} onClick={() => setNotesFontSize('sm')} title="Smaller text">A</button>
                    <button type="button" className={`notes-ctrl-btn notes-ctrl-btn--size-md${notesFontSize === 'md' ? ' active' : ''}`} onClick={() => setNotesFontSize('md')} title="Default text">A</button>
                    <button type="button" className={`notes-ctrl-btn notes-ctrl-btn--size-lg${notesFontSize === 'lg' ? ' active' : ''}`} onClick={() => setNotesFontSize('lg')} title="Larger text">A</button>
                    <button type="button" className={`notes-ctrl-btn${notesComfort ? ' active' : ''}`} onClick={() => setNotesComfort((v) => !v)} title="Serif font + warm background">
                      <Eye size={14} /> Serif
                    </button>
                    <button type="button" className={`notes-ctrl-btn${notesLineSpacing === 'relaxed' ? ' active' : ''}`} onClick={() => setNotesLineSpacing((s) => s === 'relaxed' ? 'normal' : 'relaxed')} title="Wider line spacing">
                      <AlignJustify size={14} /> Spacing
                    </button>
                    {tocItems.length > 0 && (
                      <button type="button" className={`notes-ctrl-btn${showToc ? ' active' : ''}`} onClick={() => setShowToc((v) => !v)} title="Table of contents">
                        <List size={14} /> Contents
                      </button>
                    )}
                    <button type="button" className={`notes-ctrl-btn${notesFocus ? ' active' : ''}`} onClick={() => setNotesFocus((v) => !v)} title={notesFocus ? 'Exit focus mode' : 'Focus reading mode'}>
                      {notesFocus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      {notesFocus ? 'Exit' : 'Focus'}
                    </button>
                    <button
                      type="button"
                      className="notes-ctrl-btn notes-ctrl-btn--icon"
                      onClick={() => onOpenNotesDock?.()}
                      title="Quick Notes"
                      aria-label="Quick Notes"
                    >
                      <NotebookPen size={15} strokeWidth={1.75} />
                    </button>
                    <button type="button" className="notes-ctrl-btn" onClick={handleAddBookmark} title="Bookmark current position">
                      <Bookmark size={14} /> Mark
                    </button>
                    <span className="notes-reading-controls__label notes-reading-pct notes-reading-pct--desktop">{readingProgress}%</span>
                  </div>
                  <form className="notes-search-bar" onSubmit={handleSearchSubmit}>
                    <Search size={15} className="notes-search-bar__icon" />
                    <input
                      type="search"
                      className="notes-search-bar__input"
                      placeholder="Search in these notes…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchMatchCount > 0 && (
                      <span className="notes-search-count">{searchMatchIdx + 1}/{searchMatchCount}</span>
                    )}
                    <button type="button" className="notes-search-nav" onClick={() => goToSearchMatch(-1)} disabled={!searchQuery.trim()} aria-label="Previous match">
                      <ChevronUp size={16} />
                    </button>
                    <button type="button" className="notes-search-nav" onClick={() => goToSearchMatch(1)} disabled={!searchQuery.trim()} aria-label="Next match">
                      <ChevronDown size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="notes-reading-layout">
                {showToc && tocItems.length > 0 && (
                  <aside className="notes-toc">
                    <p className="notes-toc__title">Jump to section</p>
                    <ul className="notes-toc__list">
                      {tocItems.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`notes-toc__link${item.level === 3 ? ' notes-toc__link--h3' : ''}`}
                            onClick={() => scrollToSection(item.id)}
                          >
                            {item.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {bookmarks.length > 0 && (
                      <div className="notes-bookmarks">
                        <p className="notes-toc__title">Bookmarks</p>
                        <ul className="notes-toc__list">
                          {bookmarks.map((bm) => (
                            <li key={bm.id} className="notes-bookmark-row">
                              <button type="button" className="notes-toc__link" onClick={() => jumpToBookmark(bm)}>
                                {bm.label}
                              </button>
                              <button type="button" className="notes-bookmark-del" onClick={() => removeBookmark(bm.id)} aria-label="Remove bookmark">
                                <X size={12} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </aside>
                )}

                {!showToc && bookmarks.length > 0 && (
                  <aside className="notes-toc notes-toc--bookmarks-only">
                    <p className="notes-toc__title">Bookmarks</p>
                    <ul className="notes-toc__list">
                      {bookmarks.map((bm) => (
                        <li key={bm.id} className="notes-bookmark-row">
                          <button type="button" className="notes-toc__link" onClick={() => jumpToBookmark(bm)}>
                            {bm.label}
                          </button>
                          <button type="button" className="notes-bookmark-del" onClick={() => removeBookmark(bm.id)} aria-label="Remove bookmark">
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}

              <article className={`notes-sheet notes-sheet--premium${notesComfort ? ' notes-sheet--comfort' : ''}`}>
                <header className="notes-sheet-header">
                  <div className="notes-sheet-meta">
                    <span className="notes-sheet-label">Topic notes</span>
                    <span className="notes-sheet-topic">{activeNotes.name}</span>
                  </div>
                  {isEditingNotes && (
                    <span className="notes-edit-badge">Editing</span>
                  )}
                </header>

                {isEditingNotes && (
                  <div className="notes-inline-toolbar" role="toolbar" aria-label="Note formatting">
                    <span className="notes-toolbar-label">Write</span>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('bold')} title="Bold"><Bold size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('italic')} title="Italic"><Italic size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('underline')} title="Underline"><Underline size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('formatBlock', 'h2')} title="Heading"><Heading2 size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('formatBlock', 'h3')} title="Subheading"><Heading3 size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('insertUnorderedList')} title="Bullet list"><List size={15} /></button>
                    <button type="button" className="notes-fmt-btn" onClick={() => runFormat('insertOrderedList')} title="Numbered list"><ListOrdered size={15} /></button>
                    <span className="notes-toolbar-sep" aria-hidden />
                    <span className="notes-toolbar-label">Highlight</span>
                    <button type="button" className="hl-btn hl-yellow" onClick={() => handleHighlight('yellow')} title="Yellow"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-green" onClick={() => handleHighlight('green')} title="Green"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-pink" onClick={() => handleHighlight('pink')} title="Pink"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-blue" onClick={() => handleHighlight('blue')} title="Blue"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-clear" onClick={handleRemoveHighlight} title="Remove highlight"><Eraser size={16}/></button>
                    <button type="button" className="notes-fmt-btn notes-fmt-btn--save" onClick={handleSaveNotes} disabled={isSaving} title="Save">
                      <Save size={15} /> {isSaving ? '…' : 'Save'}
                    </button>
                  </div>
                )}

                <div ref={notesScrollRef} className="notes-reader-scroll" onScroll={handleNotesScroll}>
                <div
                  ref={notesRef}
                  className={`notes-reader notes-reader--size-${notesFontSize} notes-reader--spacing-${notesLineSpacing}${notesComfort ? ' notes-reader--comfort' : ''} ${isEditingNotes ? 'editing' : ''}`}
                  id="notes-content-view"
                  contentEditable={isEditingNotes}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: localNotesHtml }}
                />

                <footer className="notes-sheet-footer">
                  <p className="notes-footer-hint">Finished reading? Test yourself on this topic.</p>
                  <button type="button" className="btn-take-test notes-cta-btn" onClick={startTest}>
                    <ClipboardList size={18} />
                    Take Topic Test
                  </button>
                </footer>
                </div>
              </article>
              </div>

            {showScrollTop && (
              <button type="button" className="notes-scroll-top" onClick={scrollNotesToTop} aria-label="Scroll to top">
                <ArrowUp size={20} />
              </button>
            )}
            {manageFlash && !showActionsMenu && (
              <div className="notes-toast">{manageFlash}</div>
            )}
          </div>

        </div>
      )}
    </>
  );
}
