import { 
  Zap, 
  Book, 
  ChevronRight, 
  Search, 
  Plus, 
  X 
} from 'lucide-react';

// Fraction ↔ Percentage Reference Sheet
const FRACTION_CONVERSIONS = [
  { fraction: '1/1', percentage: '100%' },
  { fraction: '1/2', percentage: '50%' },
  { fraction: '1/3', percentage: '33.33%' },
  { fraction: '1/4', percentage: '25%' },
  { fraction: '1/5', percentage: '20%' },
  { fraction: '1/6', percentage: '16.66%' },
  { fraction: '1/7', percentage: '14.28%' },
  { fraction: '1/8', percentage: '12.5%' },
  { fraction: '1/9', percentage: '11.11%' },
  { fraction: '1/10', percentage: '10%' },
  { fraction: '1/11', percentage: '9.09%' },
  { fraction: '1/12', percentage: '8.33%' },
  { fraction: '1/13', percentage: '7.69%' },
  { fraction: '1/14', percentage: '7.14%' },
  { fraction: '1/15', percentage: '6.66%' },
  { fraction: '1/16', percentage: '6.25%' },
  { fraction: '1/17', percentage: '5.88%' },
  { fraction: '1/18', percentage: '5.55%' },
  { fraction: '1/19', percentage: '5.26%' },
  { fraction: '1/20', percentage: '5%' },
  { fraction: '1/24', percentage: '4.16%' },
  { fraction: '1/25', percentage: '4%' },
  { fraction: '1/30', percentage: '3.33%' },
  { fraction: '1/40', percentage: '2.5%' },
  { fraction: '1/50', percentage: '2%' },
  { fraction: '2/3', percentage: '66.66%' },
  { fraction: '3/4', percentage: '75%' },
  { fraction: '2/5', percentage: '40%' },
  { fraction: '3/5', percentage: '60%' },
  { fraction: '4/5', percentage: '80%' },
  { fraction: '5/6', percentage: '83.33%' },
  { fraction: '2/7', percentage: '28.56%' },
  { fraction: '3/7', percentage: '42.84%' },
  { fraction: '4/7', percentage: '57.14%' },
  { fraction: '5/7', percentage: '71.42%' },
  { fraction: '6/7', percentage: '85.71%' },
  { fraction: '3/8', percentage: '37.5%' },
  { fraction: '5/8', percentage: '62.5%' },
  { fraction: '7/8', percentage: '87.5%' },
  { fraction: '2/9', percentage: '22.22%' },
  { fraction: '4/9', percentage: '44.44%' },
  { fraction: '5/9', percentage: '55.55%' },
  { fraction: '7/9', percentage: '77.77%' },
  { fraction: '8/9', percentage: '88.88%' },
  { fraction: '2/11', percentage: '18.18%' },
  { fraction: '3/11', percentage: '27.27%' },
  { fraction: '4/11', percentage: '36.36%' },
  { fraction: '5/11', percentage: '45.45%' },
  { fraction: '5/12', percentage: '41.66%' },
  { fraction: '7/12', percentage: '58.33%' },
  { fraction: '11/12', percentage: '91.66%' },
  { fraction: '3/16', percentage: '18.75%' },
  { fraction: '5/16', percentage: '31.25%' },
  { fraction: '7/16', percentage: '43.75%' },
  { fraction: '9/16', percentage: '56.25%' }
];

export function RevisionWorkspace({
  deckTab,
  setDeckTab,
  tableSubTab,
  setTableSubTab,
  expandedTable,
  setExpandedTable,
  vocabSearch,
  setVocabSearch,
  vocabCategory,
  setVocabCategory,
  vocabListLoading,
  filteredVocabDB,
  setVocabModalOpen,
  openEditVocab,
  loadVocabList,
  vocabModalOpen,
  editingVocabId,
  vocabForm,
  setVocabForm,
  handleVocabSubmit,
  vocabFormError,
  vocabFormSuccess,
  resetVocabForm,
  vocabBulkModalOpen,
  setVocabBulkModalOpen,
  vocabBulkJson,
  setVocabBulkJson,
  vocabBulkError,
  vocabBulkSuccess,
  handleVocabBulkSubmit,
  vocabPage,
  vocabTotalPages,
  handleVocabPageChange
}) {
  return (
    <>
      {/* --- VIEW: REVISION DECK --- */}
      <div className="study-workspace revision-workspace">
        <div className="workspace-header-sticky">
          <div className="section-header">
            <h1>Revision Deck</h1>
            <p>Quick sheets for tables, fractions, and vocabulary reference.</p>
          </div>

          {/* TOP TABS: Tables | Vocab */}
          <div className="tabs-header tabs-header--scroll">
            <div className="drill-tabs">
              <button
                className={`drill-tab ${deckTab === 'tables' ? 'active' : ''}`}
                onClick={() => setDeckTab('tables')}
              >
                <Zap size={14} />
                <span>Tables & Fractions</span>
              </button>
              <button
                className={`drill-tab ${deckTab === 'vocab' ? 'active' : ''}`}
                onClick={() => { setDeckTab('vocab'); loadVocabList(); }}
              >
                <Book size={14} />
                <span>Vocabulary</span>
              </button>
            </div>
          </div>

          {deckTab === 'tables' && (
            <div className="revision-sub-tabs">
              {['tables','squares','cubes','fractions','percentages'].map(st => (
                <button
                  key={st}
                  className={`revision-sub-tab ${tableSubTab === st ? 'active' : ''}`}
                  onClick={() => setTableSubTab(st)}
                >
                  { st === 'tables' ? '× Tables'
                    : st === 'squares' ? 'x² Squares'
                    : st === 'cubes' ? 'x³ Cubes'
                    : st === 'fractions' ? '½ → %'
                    : '% → Fraction' }
                </button>
              ))}
            </div>
          )}

          {deckTab === 'vocab' && (
            <div className="revision-vocab-toolbar">
              <div className="vocab-add-bar">
                <div className="vocab-search-bar vocab-search-flex">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search word, synonym, antonym, idiom..."
                    value={vocabSearch}
                    onChange={(e) => setVocabSearch(e.target.value)}
                  />
                </div>
                <div className="vocab-add-bar__actions">
                  <button type="button" className="btn-add-vocab btn-add-vocab--secondary" onClick={() => setVocabBulkModalOpen(true)}>
                    <Plus size={15} /> Bulk Import
                  </button>
                  <button type="button" className="btn-add-vocab" onClick={() => setVocabModalOpen(true)}>
                    <Plus size={15} /> Add New
                  </button>
                </div>
              </div>

              <div className="revision-sub-tabs revision-sub-tabs--vocab">
                {['All','Word Power','Idioms & Phrases','One Word Substitution','Spelling Rules'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`revision-sub-tab ${vocabCategory === cat ? 'active' : ''}`}
                    onClick={() => setVocabCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="workspace-scrollable-content">

        {/* ── TABLES & FRACTIONS TAB ── */}
        {deckTab === 'tables' && (
          <div>

            {/* Multiplication Tables — inline one-line-per-row */}
            {tableSubTab === 'tables' && (
              <div className="tables-deck-grid">
                {Array(50).fill(null).map((_, idx) => {
                  const num = idx + 1;
                  const isExpanded = expandedTable === num;
                  return (
                    <div key={num} className={`table-card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="table-card-header" onClick={() => setExpandedTable(isExpanded ? null : num)}>
                        <h3>Table of {num}</h3>
                        <ChevronRight className={`arrow-icon ${isExpanded ? 'rotate-90' : ''}`} size={16} />
                      </div>
                      {isExpanded && (
                        <div className="table-card-body">
                          <div className="multipliers-grid">
                            {Array(10).fill(null).map((_, mIdx) => {
                              const m = mIdx + 1;
                              return (
                                <div key={m} className="multiplier-row">
                                  <span>{num} × {m}</span>
                                  <span>=</span>
                                  <strong>{num * m}</strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Squares */}
            {tableSubTab === 'squares' && (
              <div className="tables-deck-grid">
                {Array(50).fill(null).map((_, idx) => {
                  const num = idx + 1;
                  const isImportant = num <= 30;
                  return (
                    <div key={num} className="table-card">
                      <div className="table-card-header" style={{ cursor: 'default' }}>
                        <h3>
                          {num}² = {num * num}
                          {isImportant && <span className="pos-badge" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>★ IMP</span>}
                        </h3>
                      </div>
                      <div className="table-card-body" style={{ position: 'relative', borderTop: '1px solid var(--border-color)', borderRadius: 0, padding: '8px 18px' }}>
                        <div className="multipliers-grid">
                          <div className="multiplier-row">
                            <span>√{num * num}</span>
                            <span>=</span>
                            <strong>{num}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cubes */}
            {tableSubTab === 'cubes' && (
              <div className="tables-deck-grid">
                {Array(50).fill(null).map((_, idx) => {
                  const num = idx + 1;
                  const isImportant = num <= 20;
                  return (
                    <div key={num} className="table-card">
                      <div className="table-card-header" style={{ cursor: 'default' }}>
                        <h3>
                          {num}³ = {num * num * num}
                          {isImportant && <span className="pos-badge" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>★ IMP</span>}
                        </h3>
                      </div>
                      <div className="table-card-body" style={{ position: 'relative', borderTop: '1px solid var(--border-color)', borderRadius: 0, padding: '8px 18px' }}>
                        <div className="multipliers-grid">
                          <div className="multiplier-row">
                            <span>∛{num * num * num}</span>
                            <span>=</span>
                            <strong>{num}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fraction → Percentage */}
            {tableSubTab === 'fractions' && (
              <div className="fraction-list">
                {FRACTION_CONVERSIONS.map(fc => (
                  <div key={fc.fraction} className="fraction-row">
                    <span className="frac-lhs">{fc.fraction}</span>
                    <span className="frac-arrow">→</span>
                    <span className="frac-rhs">{fc.percentage}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Percentage → Fraction */}
            {tableSubTab === 'percentages' && (
              <div className="fraction-list">
                {FRACTION_CONVERSIONS.map(fc => (
                  <div key={fc.percentage} className="fraction-row">
                    <span className="frac-lhs">{fc.percentage}</span>
                    <span className="frac-arrow">→</span>
                    <span className="frac-rhs">{fc.fraction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VOCABULARY TAB ── */}
        {deckTab === 'vocab' && (
          <div className="vocab-deck-container">
            {/* Vocab Cards Grid */}
            <div className={`vocab-results-grid${vocabListLoading ? ' vocab-results-grid--loading' : ''}`}>
              {vocabListLoading && filteredVocabDB.length === 0 ? (
                <div className="empty-syllabus" style={{ gridColumn: '1 / -1' }}>Loading vocabulary...</div>
              ) : filteredVocabDB.length > 0 ? (
                filteredVocabDB.map((item) => (
                  <div key={item._id || item.word} className="vocab-term-card">
                    <div className="vocab-term-header">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.word}
                        {item.isImportant && <span className="pos-badge" style={{ fontSize: '0.65rem', background: '#eab308', color: '#000' }}>★ IMP</span>}
                      </h3>
                      <span className="pos-badge">{item.category || item.pos}</span>
                    </div>
                    <p className="vocab-def">"{item.definition}"</p>

                    {/* Synonyms */}
                    {item.synonyms?.length > 0 && (
                      <div className="vocab-chip-row">
                        <span className="vocab-chip-label">Syn:</span>
                        {(Array.isArray(item.synonyms) ? item.synonyms : item.synonyms.split(',')).map((s, i) => (
                          <span key={i} className="vocab-chip syn">{s.trim()}</span>
                        ))}
                      </div>
                    )}

                    {/* Antonyms */}
                    {item.antonyms?.length > 0 && (
                      <div className="vocab-chip-row">
                        <span className="vocab-chip-label">Ant:</span>
                        {(Array.isArray(item.antonyms) ? item.antonyms : item.antonyms.split(',')).map((a, i) => (
                          <span key={i} className="vocab-chip ant">{a.trim()}</span>
                        ))}
                      </div>
                    )}

                    <div className="vocab-card-actions">
                      <button className="vocab-action-btn" onClick={() => openEditVocab(item)}>Edit</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-syllabus" style={{ gridColumn: '1 / -1' }}>
                  No vocabulary items found. Add some using the "Add New" button!
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {vocabTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '15px' }}>
                <button 
                  className="btn-action" 
                  onClick={() => handleVocabPageChange(vocabPage - 1)} 
                  disabled={vocabPage === 1 || vocabListLoading}
                  style={{ opacity: (vocabPage === 1 || vocabListLoading) ? 0.5 : 1, cursor: (vocabPage === 1 || vocabListLoading) ? 'not-allowed' : 'pointer' }}
                >
                  &larr; Previous
                </button>
                <span style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                  Page {vocabPage} of {vocabTotalPages}
                </span>
                <button 
                  className="btn-action" 
                  onClick={() => handleVocabPageChange(vocabPage + 1)} 
                  disabled={vocabPage === vocabTotalPages || vocabListLoading}
                  style={{ opacity: (vocabPage === vocabTotalPages || vocabListLoading) ? 0.5 : 1, cursor: (vocabPage === vocabTotalPages || vocabListLoading) ? 'not-allowed' : 'pointer' }}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ── ADD / EDIT VOCAB MODAL ── */}
      {vocabModalOpen && (
        <div className="modal-overlay" onClick={() => setVocabModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingVocabId ? 'Edit Vocabulary' : 'Add Vocabulary Entry'}</h3>
              <button className="btn-close-modal" onClick={() => { setVocabModalOpen(false); resetVocabForm(); }}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleVocabSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Word / Phrase *</label>
                  <input value={vocabForm.word} onChange={e => setVocabForm(p => ({...p, word: e.target.value}))} required placeholder="e.g. Ephemeral" />
                </div>
                <div className="form-group">
                  <label>Part of Speech</label>
                  <input value={vocabForm.pos} onChange={e => setVocabForm(p => ({...p, pos: e.target.value}))} placeholder="Adjective / Noun / Idiom..." />
                </div>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={vocabForm.category} onChange={e => setVocabForm(p => ({...p, category: e.target.value}))}
                  style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.92rem' }}
                >
                  <option value="Word Power">Word Power</option>
                  <option value="Idioms & Phrases">Idioms & Phrases</option>
                  <option value="One Word Substitution">One Word Substitution</option>
                  <option value="Spelling Rules">Spelling Rules</option>
                </select>
              </div>
              <div className="form-group">
                <label>Definition *</label>
                <textarea rows="2" value={vocabForm.definition} onChange={e => setVocabForm(p => ({...p, definition: e.target.value}))} required placeholder="Meaning of the word..." />
              </div>
              <div className="form-group">
                <label>Synonyms <span style={{color:'var(--text-muted)', fontWeight:400}}>(comma separated)</span></label>
                <input value={vocabForm.synonyms} onChange={e => setVocabForm(p => ({...p, synonyms: e.target.value}))} placeholder="e.g. Transient, Fleeting, Brief" />
              </div>
              <div className="form-group">
                <label>Antonyms <span style={{color:'var(--text-muted)', fontWeight:400}}>(comma separated)</span></label>
                <input value={vocabForm.antonyms} onChange={e => setVocabForm(p => ({...p, antonyms: e.target.value}))} placeholder="e.g. Eternal, Enduring, Permanent" />
              </div>
              {vocabFormError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{vocabFormError}</p>}
              {vocabFormSuccess && <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>{vocabFormSuccess}</p>}
              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => { setVocabModalOpen(false); resetVocabForm(); }}>Cancel</button>
                <button type="submit" className="btn-save-topic">{editingVocabId ? 'Update Entry' : 'Add to Deck'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BULK IMPORT VOCAB MODAL ── */}
      {vocabBulkModalOpen && (
        <div className="modal-overlay" onClick={() => setVocabBulkModalOpen(false)}>
          <div className="modal-content-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Import Vocabulary</h3>
              <button className="btn-close-modal" onClick={() => setVocabBulkModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleVocabBulkSubmit}>
              <div className="form-group">
                <label>
                  Paste JSON Array
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '4px' }}>
                    Valid Categories: "Word Power", "Idioms & Phrases", "One Word Substitution", "Spelling Rules"<br/>
                    <pre style={{ margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`[
  { "word": "Ephemeral", "pos": "Adjective", "category": "Word Power", "definition": "Short-lived", "synonyms": "Brief", "antonyms": "Eternal" },
  { "word": "Break the ice", "pos": "Idiom", "category": "Idioms & Phrases", "definition": "To relieve tension", "synonyms": "", "antonyms": "" },
  { "word": "Altruist", "pos": "Noun", "category": "One Word Substitution", "definition": "A selfless person", "synonyms": "Philanthropist", "antonyms": "Egoist" }
]`}
                    </pre>
                  </span>
                </label>
                <textarea 
                  rows="12" 
                  value={vocabBulkJson} 
                  onChange={e => setVocabBulkJson(e.target.value)} 
                  placeholder="Paste JSON Array of vocabulary here..."
                  style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-input)' }}
                  required
                />
              </div>

              {vocabBulkError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{vocabBulkError}</p>}
              {vocabBulkSuccess && <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>{vocabBulkSuccess}</p>}

              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => setVocabBulkModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save-topic">Import JSON</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
