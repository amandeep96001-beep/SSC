import { useState } from 'react';
import { Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

export function PerformanceWorkspace({ user }) {
  const [activeTab, setActiveTab] = useState('syllabus');

  // Syllabus stats
  const progressCount = user.progress?.length || 0;
  const averageScore = progressCount > 0 
    ? Math.round(user.progress.reduce((sum, curr) => sum + curr.score, 0) / progressCount) 
    : 0;
  const averageMaxScore = progressCount > 0
    ? Math.round(user.progress.reduce((sum, curr) => sum + (curr.maxScore || 50), 0) / progressCount)
    : 50;
  const masteredCount = user.progress?.filter(p => p.status === 'green').length || 0;
  const reviewingCount = user.progress?.filter(p => p.status === 'yellow').length || 0;
  const revisionNeededCount = user.progress?.filter(p => p.status === 'red').length || 0;

  // Mock stats
  const mockCount = user.mockProgress?.length || 0;
  const averageMockScore = mockCount > 0 
    ? (user.mockProgress.reduce((sum, curr) => sum + curr.score, 0) / mockCount).toFixed(1) 
    : "0.0";
  const averageMockAccuracy = mockCount > 0 
    ? Math.round(user.mockProgress.reduce((sum, curr) => sum + curr.accuracy, 0) / mockCount) 
    : 0;
  const totalMockCorrect = user.mockProgress?.reduce((sum, curr) => sum + curr.correct, 0) || 0;
  const totalMockWrong = user.mockProgress?.reduce((sum, curr) => sum + curr.wrong, 0) || 0;

  return (
    <div className="study-workspace">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Performance Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your target concepts, average mock scores, and revision statistics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="revision-sub-tabs" style={{ marginBottom: '24px' }}>
        <button 
          className={`revision-sub-tab ${activeTab === 'syllabus' ? 'active' : ''}`}
          onClick={() => setActiveTab('syllabus')}
        >
          Syllabus Practice (25 Qs)
        </button>
        <button 
          className={`revision-sub-tab ${activeTab === 'mock' ? 'active' : ''}`}
          onClick={() => setActiveTab('mock')}
        >
          Full Mock Exams (100 Qs)
        </button>
      </div>

      {activeTab === 'syllabus' ? (
        <>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-label">Tests Completed</span>
              <span className="stat-val">{progressCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Score</span>
              <span className="stat-val score-blue">{averageScore} / {averageMaxScore}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Mastered (Green)</span>
              <span className="stat-val" style={{ color: '#2ecc71', marginTop: '6px' }}>{masteredCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Reviewing (Yellow)</span>
              <span className="stat-val" style={{ color: '#f1c40f', marginTop: '6px' }}>{reviewingCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Needs Help (Red)</span>
              <span className="stat-val" style={{ color: '#e74c3c', marginTop: '6px' }}>{revisionNeededCount}</span>
            </div>
          </div>

          <div className="performance-history-card">
            <h3>Syllabus Test Log History</h3>
            <div className="table-responsive">
              {user.progress && user.progress.length > 0 ? (
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Topic Code</th>
                      <th>Recorded Score</th>
                      <th>Accuracy Grade Status</th>
                      <th>Time Taken</th>
                      <th>Completion Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.progress.map((record, i) => (
                      <tr key={i} style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td>
                          <code style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px' }}>{record.topicId}</code>
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(59,130,246,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            Attempt {record.attemptNumber || 1}
                          </span>
                        </td>
                        <td><strong>{record.score} / {record.maxScore || 50}</strong></td>
                        <td>
                          <span className={`status-badge-pill ${record.status}`} style={{ padding: '6px 12px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {record.status === 'green' && 'Mastered'}
                            {record.status === 'yellow' && 'Reviewing'}
                            {record.status === 'red' && 'Action Needed'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> {record.elapsedTime || 'N/A'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(record.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No tests taken yet. Head over to Syllabus & Notes and start a Mock Exam!</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-label">Mocks Completed</span>
              <span className="stat-val">{mockCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Mock Score</span>
              <span className="stat-val score-blue">{averageMockScore} / 200</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Accuracy</span>
              <span className="stat-val score-green">{averageMockAccuracy}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Correct Answers</span>
              <span className="stat-val score-yellow">{totalMockCorrect}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Wrong Answers</span>
              <span className="stat-val score-red">{totalMockWrong}</span>
            </div>
          </div>

          <div className="performance-history-card">
            <h3>Full Mock Exam Log History</h3>
            <div className="table-responsive">
              {user.mockProgress && user.mockProgress.length > 0 ? (
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Mock Test Title</th>
                      <th>Official Score</th>
                      <th>Section-wise Stats Breakdown</th>
                      <th>Accuracy %</th>
                      <th>Time Tracking</th>
                      <th>Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.mockProgress.map((record, i) => (
                      <tr key={i} style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{record.title}</strong>
                          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                            <span style={{ background: 'rgba(59,130,246,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                              Attempt {record.attemptNumber || 1}
                            </span>
                          </div>
                        </td>
                        <td><strong style={{ fontSize: '1.1rem', color: '#fff' }}>{record.score} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>/ 200</span></strong></td>
                        <td>
                          <div style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#2ecc71', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> {record.correct}
                            </span> 
                            <span style={{color: 'rgba(255,255,255,0.2)'}}>|</span>
                            <span style={{ color: '#e74c3c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={14} /> {record.wrong}
                            </span> 
                            <span style={{color: 'rgba(255,255,255,0.2)'}}>|</span>
                            <span style={{ color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MinusCircle size={14} /> {record.blank}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge-pill ${record.accuracy >= 80 ? 'green' : record.accuracy >= 50 ? 'yellow' : 'red'}`} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            {record.accuracy}% Accuracy
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} /> {record.elapsedTime || 'N/A'}
                          </div>
                          {record.sectionTimes && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', fontSize: '0.75rem' }}>
                              {Object.entries(record.sectionTimes).map(([sec, secs]) => (
                                <div key={sec} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{sec.slice(0,3)}:</span> <span style={{ color: '#fff' }}>{Math.floor(secs / 60)}m {secs % 60}s</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(record.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '10px' }}>
                        * Mock exam grades are computed on the official SSC scheme: +2 for correct, -0.5 for wrong answers.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No full mock exams taken yet. Navigate to Full Mock section, upload or select a test, and test your speed!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
