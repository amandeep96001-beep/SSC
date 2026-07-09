import { useState, useRef, useCallback } from 'react';
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
  Eraser
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

  if (activeNotes !== prevActiveNotes) {
    setPrevActiveNotes(activeNotes);
    const stored = activeNotes ? localStorage.getItem(`ssc_notes_${activeNotes.id}`) : null;
    setLocalNotesHtml(prepareNotesHtml(stored || activeNotes?.notes || ''));
  }

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
        <div className="study-workspace">
          <div className="workspace-header-sticky">
            <div className="section-header page-header">
              <div className="page-header__title">
                <h1>Select Subject Area</h1>
                <p>Access notes, revision structures, and complete Previous Year Questions mock tests.</p>
              </div>
            </div>
          </div>
          <div className="workspace-scrollable-content">
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
        <div className="study-workspace">
          <div className="workspace-header-sticky">
            <div className="section-header page-header">
              <div className="page-header__title">
                <h1>{selectedSubject} — Topics</h1>
                <p>Select a topic to read revision notes and take a speed test.</p>
              </div>
              <div className="page-header__actions">
                <button className="btn-back" onClick={() => setActiveView('subjects')}>
                  All Subjects
                </button>
                <button className="btn-add" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add Topic
                </button>
              </div>
            </div>
          </div>
          <div className="workspace-scrollable-content">
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
                        {/* Color indicator dot */}
                        <span className={`progress-status-dot ${status}`} title={
                          status === 'green' ? `Mastered (Score: ${score}/${maxScore})` :
                          status === 'yellow' ? `Reviewing (Score: ${score}/${maxScore})` :
                          status === 'red' ? `Action Needed (Score: ${score}/${maxScore})` :
                          'Unattempted'
                        }></span>
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
        <div className="study-workspace">
          <div className="workspace-header-sticky">
            <div className="section-header page-header">
              <div className="page-header__title">
                <h1>{activeNotes.name} Revision Sheet</h1>
                <p>Read formulas, shortcut tricks, and concepts below.</p>
              </div>
              <div className="page-header__actions" style={{ position: 'relative' }}>
                <button className="btn-add" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setShowActionsMenu(!showActionsMenu)}>
                  Actions <ChevronRight size={16} style={{ transform: showActionsMenu ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', marginLeft: '4px' }} />
                </button>
                <button className="btn-back" onClick={() => { setIsEditingNotes(false); setActiveView('topics'); setShowActionsMenu(false); }}>
                  Back to Topics
                </button>

                {showActionsMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10, minWidth: '220px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    <button className={`notes-action-btn ${isEditingNotes ? 'active' : ''}`} style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { handleEditToggle(); }}>
                      {isEditingNotes ? <X size={16} /> : <Pencil size={16} />}
                      {isEditingNotes ? 'Stop Editing' : 'Edit Notes'}
                    </button>
                    {isEditingNotes && (
                      <button className="notes-action-btn save" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleSaveNotes} disabled={isSaving}>
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                    <button className="btn-take-test" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { startTest(); setShowActionsMenu(false); }}>
                      <ClipboardList size={16} />
                      Take Topic Test
                    </button>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Highlighter Tools</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="hl-btn" style={{ color: '#eab308', background: 'rgba(234,179,8,0.15)' }} onClick={() => handleHighlight('yellow')} title="Yellow"><Highlighter size={16}/></button>
                        <button className="hl-btn" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.15)' }} onClick={() => handleHighlight('green')} title="Green"><Highlighter size={16}/></button>
                        <button className="hl-btn" style={{ color: '#ec4899', background: 'rgba(236,72,153,0.15)' }} onClick={() => handleHighlight('pink')} title="Pink"><Highlighter size={16}/></button>
                        <button className="hl-btn" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.15)' }} onClick={() => handleHighlight('blue')} title="Blue"><Highlighter size={16}/></button>
                        <button className="hl-btn" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }} onClick={handleRemoveHighlight} title="Remove Highlight"><Eraser size={16}/></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="workspace-scrollable-content">
            <div className="revision-notes-container">
              <article className="notes-sheet">
                <header className="notes-sheet-header">
                  <div className="notes-sheet-meta">
                    <span className="notes-sheet-label">Revision Notes</span>
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

                <div
                  ref={notesRef}
                  className={`notes-reader ${isEditingNotes ? 'editing' : ''}`}
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
              </article>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
