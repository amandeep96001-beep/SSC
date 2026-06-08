import { useState, useRef, useCallback } from 'react';
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
  const notesRef = useRef(null);

  const handleEditToggle = () => {
    setIsEditingNotes(prev => !prev);
  };

  const handleSaveNotes = useCallback(async () => {
    if (!notesRef.current) return;
    setIsSaving(true);
    const newHtml = notesRef.current.innerHTML;
    const res = await updateCustomTopic(activeNotes.id, {
      name: activeNotes.name,
      notes: newHtml,
      questions: []
    });
    setIsSaving(false);
    if (res.success) {
      activeNotes.notes = newHtml;
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
        const res = await updateCustomTopic(activeNotes.id, {
          name: activeNotes.name,
          notes: newHtml,
          questions: []
        });
        if (res.success) {
          activeNotes.notes = newHtml;
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
        const res = await updateCustomTopic(activeNotes.id, {
          name: activeNotes.name,
          notes: newHtml,
          questions: []
        });
        if (res.success) {
          activeNotes.notes = newHtml;
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
            <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
              <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
                <h1 style={{ margin: '0 0 6px 0' }}>Select Subject Area</h1>
                <p style={{ margin: 0 }}>Access notes, revision structures, and complete Previous Year Questions mock tests.</p>
              </div>
            </div>
          </div>
          <div className="workspace-scrollable-content">
            <div className="subject-grid">
              {subjects.map((sub) => (
                <div key={sub} className="subject-selection-card" onClick={() => selectSubject(sub)}>
                  <BookMarked className="subject-icon" size={32} />
                  <div className="subject-card-info">
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
            <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
              <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
                <h1 style={{ margin: '0 0 6px 0' }}>{selectedSubject} — Topics</h1>
                <p style={{ margin: 0 }}>Select a topic to read revision notes and take a speed test.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
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
            <div className="topics-grid">
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
            <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
              <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
                <h1 style={{ margin: '0 0 6px 0' }}>{activeNotes.name} Revision Sheet</h1>
                <p style={{ margin: 0 }}>Read formulas, shortcut tricks, and concepts below.</p>
              </div>
              <button className="btn-back" style={{ marginLeft: 'auto' }} onClick={() => { setIsEditingNotes(false); setActiveView('topics'); }}>
                Back to Topics
              </button>
            </div>

            {/* Notes Toolbar — Highlight + Edit + Test */}
            <div className="notes-toolbar-strip">
              <div className="notes-toolbar-left">
                <div className="highlight-palette">
                  <span className="palette-label"><Highlighter size={14} /> Highlight:</span>
                  <button className="hl-btn" style={{ color: '#eab308', background: 'rgba(234,179,8,0.15)' }} onClick={() => handleHighlight('yellow')} title="Yellow"><Highlighter size={16}/></button>
                  <button className="hl-btn" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.15)' }} onClick={() => handleHighlight('green')} title="Green"><Highlighter size={16}/></button>
                  <button className="hl-btn" style={{ color: '#ec4899', background: 'rgba(236,72,153,0.15)' }} onClick={() => handleHighlight('pink')} title="Pink"><Highlighter size={16}/></button>
                  <button className="hl-btn" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.15)' }} onClick={() => handleHighlight('blue')} title="Blue"><Highlighter size={16}/></button>
                  <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
                  <button className="hl-btn" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }} onClick={handleRemoveHighlight} title="Remove Highlight"><Eraser size={16}/></button>
                </div>

                <button className={`notes-action-btn ${isEditingNotes ? 'active' : ''}`} onClick={handleEditToggle}>
                  {isEditingNotes ? <X size={16} /> : <Pencil size={16} />}
                  {isEditingNotes ? 'Stop Editing' : 'Edit Notes'}
                </button>

                {isEditingNotes && (
                  <button className="notes-action-btn save" onClick={handleSaveNotes} disabled={isSaving}>
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>

              <button className="btn-take-test" onClick={startTest}>
                <ClipboardList size={16} />
                Take Topic Test
              </button>
            </div>
          </div>

          <div className="workspace-scrollable-content">
            <div className="revision-notes-container">
              <div className="notes-sheet">
                <pre
                  ref={notesRef}
                  className={`notes-display-pre ${isEditingNotes ? 'editing' : ''}`}
                  id="notes-content-view"
                  contentEditable={isEditingNotes}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: activeNotes.notes }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
