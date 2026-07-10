import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { prepareNotesHtml } from '@/shared/utils/notesMarkup';
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
  Search,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlignJustify,
  Settings2
} from 'lucide-react';

export function SyllabusWorkspace({
  activeView,
  setActiveView,
  subjects,
  selectSubject,
  selectedSubject,
  topicsList,
  selectTopic,
  user,
  setModalOpen,
  handleOpenEditModal,
  handleDeleteClick,
  activeNotes,
  startTest,
  updateCustomTopic
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

  const [notesFontSize, setNotesFontSize] = useState(() => localStorage.getItem('ssc_notes_font') || 'md');
  const [notesComfort, setNotesComfort] = useState(() => localStorage.getItem('ssc_notes_comfort') === '1');
  const [notesLineSpacing, setNotesLineSpacing] = useState(() => localStorage.getItem('ssc_notes_spacing') || 'normal');
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

  const readStats = useMemo(() => {
    const plain = (localNotesHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain ? plain.split(' ').filter(Boolean).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [localNotesHtml]);

  const isTopicRead = useMemo(() => {
    if (!activeNotes) return false;
    return Boolean(localStorage.getItem(`ssc_notes_done_${activeNotes.id}`));
  }, [activeNotes, readingProgress]);

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
    if (pct >= 90 && activeNotes?.id) {
      localStorage.setItem(`ssc_notes_done_${activeNotes.id}`, new Date().toISOString());
    }
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

  const handleSaveNotes = useCallback(async () => {
    if (!notesRef.current) return;
    setIsSaving(true);
    const newHtml = notesRef.current.innerHTML;
    localStorage.setItem(`ssc_notes_${activeNotes.id}`, newHtml);
    const res = await updateCustomTopic(activeNotes.id, {
      name: activeNotes.name,
      notes: newHtml,
      questions: []
    });
    setIsSaving(false);
    if (res.success) {
      setLocalNotesHtml(newHtml);
      setIsEditingNotes(false);
    } else {
      alert(res.message || "Failed to save notes");
    }
  }, [activeNotes, updateCustomTopic]);

  const handleHighlight = useCallback(async (color) => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = `hl-${color}`;
    
    try {
      range.surroundContents(mark);
      selection.removeAllRanges();
      // Auto-save the highlight
      if (notesRef.current) {
        const newHtml = notesRef.current.innerHTML;
        localStorage.setItem(`ssc_notes_${activeNotes.id}`, newHtml);
        const res = await updateCustomTopic(activeNotes.id, {
          name: activeNotes.name,
          notes: newHtml,
          questions: []
        });
        if (res.success) {
          setLocalNotesHtml(newHtml);
        }
      }
    } catch {
      alert("Please select text within a single line to highlight.");
    }
  }, [activeNotes, updateCustomTopic]);

  const handleRemoveHighlight = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      alert("Please click inside or select the highlighted text you want to remove.");
      return;
    }
    
    let node = selection.anchorNode;
    // Walk up to find the <mark> tag
    while (node && node.nodeName !== 'MARK' && node.id !== 'notes-content-view') {
      node = node.parentNode;
    }
    
    if (node && node.nodeName === 'MARK') {
      // Unwrap the <mark> tag
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      
      // Auto-save the un-highlight
      if (notesRef.current) {
        const newHtml = notesRef.current.innerHTML;
        localStorage.setItem(`ssc_notes_${activeNotes.id}`, newHtml);
        const res = await updateCustomTopic(activeNotes.id, {
          name: activeNotes.name,
          notes: newHtml,
          questions: []
        });
        if (res.success) {
          setLocalNotesHtml(newHtml);
        }
      }
    } else {
      alert("Please click inside an existing highlight to remove it.");
    }
  }, [activeNotes, updateCustomTopic]);

  return (
    <>
      {/* --- VIEW: SUBJECT LISTS --- */}
      {activeView === 'subjects' && (
        <div className="study-workspace syllabus-flow">
          <header className="syllabus-page-header">
            <h1>Select Subject Area</h1>
            <p>Access notes, revision structures, and complete Previous Year Questions mock tests.</p>
          </header>
          <div className="syllabus-page-body">
            <div className="subjects-grid">
              {subjects.map((sub) => (
                <div key={sub} className="subject-selection-card" onClick={() => selectSubject(sub)}>
                  <div className="subject-icon-box">
                    <BookMarked size={24} />
                  </div>
                  <div className="subject-content">
                    <h3>{sub}</h3>
                    <p>Read detailed syllabus points and practice mock tests.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={18} />
                </div>
              ))}
            </div>
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
                <p>Select a topic to read revision notes and take a speed test.</p>
              </div>
              <div className="syllabus-page-header__actions">
                <button type="button" className="btn-back" onClick={() => setActiveView('subjects')}>
                  All Subjects
                </button>
                <button type="button" className="btn-add" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add Topic
                </button>
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
                      <div className="topic-actions-bar" style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '12px' }}>
                        <button 
                          type="button" 
                          className="btn-topic-action edit"
                          onClick={(e) => handleOpenEditModal(e, topic)}
                          title="Edit Notes"
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
              <div className="empty-syllabus">
                <p>No active topics are seeded under this subject yet.</p>
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
                <span className="notes-breadcrumb">Revision Notes</span>
                <h1>{activeNotes.name}</h1>
              </div>
              <div className="syllabus-page-header__actions notes-toolbar-actions">
                <button type="button" className="btn-add" onClick={() => setShowActionsMenu(!showActionsMenu)}>
                  Actions <ChevronRight size={16} style={{ transform: showActionsMenu ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', marginLeft: '4px' }} />
                </button>
                <button type="button" className="btn-back" onClick={() => { setIsEditingNotes(false); setActiveView('topics'); setShowActionsMenu(false); }}>
                  Back to Topics
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
                  <span className="notes-reading-compact__meta">
                    {readStats.minutes} min · {readingProgress}%
                    {isTopicRead && <span className="notes-reading-done"><CheckCircle2 size={13} /> Done</span>}
                  </span>
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
                    <span className="notes-reading-meta notes-reading-meta--desktop">{readStats.minutes} min · {readStats.words} words</span>
                    {isTopicRead && (
                      <span className="notes-reading-done notes-reading-done--desktop"><CheckCircle2 size={14} /> Done</span>
                    )}
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
                  </aside>
                )}

              <article className={`notes-sheet notes-sheet--premium${notesComfort ? ' notes-sheet--comfort' : ''}`}>
                <header className="notes-sheet-header">
                  <div className="notes-sheet-meta">
                    <span className="notes-sheet-label">Study Material</span>
                    <span className="notes-sheet-topic">{activeNotes.name}</span>
                  </div>
                  {isEditingNotes && (
                    <span className="notes-edit-badge">Editing</span>
                  )}
                </header>

                {isEditingNotes && (
                  <div className="notes-inline-toolbar" role="toolbar" aria-label="Note formatting">
                    <span className="notes-toolbar-label">Highlight</span>
                    <button type="button" className="hl-btn hl-yellow" onClick={() => handleHighlight('yellow')} title="Yellow"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-green" onClick={() => handleHighlight('green')} title="Green"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-pink" onClick={() => handleHighlight('pink')} title="Pink"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-blue" onClick={() => handleHighlight('blue')} title="Blue"><Highlighter size={16}/></button>
                    <button type="button" className="hl-btn hl-clear" onClick={handleRemoveHighlight} title="Remove highlight"><Eraser size={16}/></button>
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
          </div>
        </div>
      )}
    </>
  );
}
