import { 
  BookMarked, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  ClipboardList 
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
  startTest
}) {
  return (
    <>
      {/* --- VIEW: SUBJECT LISTS --- */}
      {activeView === 'subjects' && (
        <div className="study-workspace">
          <div className="section-header">
            <h1 style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Select Subject Area</h1>
            <p>Access notes, revision structures, and complete Previous Year Questions mock tests.</p>
          </div>

          <div className="subjects-grid">
            {subjects.map((sub) => (
              <div 
                key={sub}
                className="subject-selection-card"
                onClick={() => selectSubject(sub)}
              >
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
      )}

      {/* --- VIEW: TOPICS/SYLLABUS OUTLINES WITH ACCURACY INDICATORS --- */}
      {activeView === 'topics' && (
        <div className="study-workspace">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>{selectedSubject} Syllabus</h1>
              <p>Browse core revision concepts mapped for CGL/CHSL candidates.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-create-topic" onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                <span>Add Custom Topic</span>
              </button>
              <button className="btn-back" onClick={() => setActiveView('subjects')}>
                Back to Subjects
              </button>
            </div>
          </div>

          <div className="topics-list-container">
            {topicsList.length > 0 ? (
              topicsList.map((topic) => {
                // Look up topic accuracy indicators in user's profile
                const progressRecord = user.progress?.find(p => p.topicId === topic.id);
                const status = progressRecord?.status || 'gray';
                const score = progressRecord?.score;

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
                          status === 'green' ? `Mastered (Score: ${score}/50)` :
                          status === 'yellow' ? `Reviewing (Score: ${score}/50)` :
                          status === 'red' ? `Action Needed (Score: ${score}/50)` :
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
                        <span className="topic-score-badge">Latest: {score}/50</span>
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
      )}

      {/* --- VIEW: TOPIC REVISION NOTES & TEST STARTER --- */}
      {activeView === 'notes' && activeNotes && (
        <div className="study-workspace">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>{activeNotes.name} Revision Sheet</h1>
              <p>Read formulas, shortcut tricks, and concepts below.</p>
            </div>
            <button className="btn-back" onClick={() => setActiveView('topics')}>
              Back to Topics
            </button>
          </div>

          <div className="revision-notes-container">
            <div className="notes-sheet">
              <pre className="notes-display-pre">
                {activeNotes.notes}
              </pre>
            </div>

            <div className="take-test-strip">
              <div className="strip-info">
                <ClipboardList size={22} className="strip-icon" />
                <div>
                  <h4>Ready to test your speed?</h4>
                  <p>Launches a real TCS iON simulated test consisting of 25 PYQs.</p>
                </div>
              </div>
              <button className="btn-take-test" onClick={startTest}>
                Take 25-Question Test
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
