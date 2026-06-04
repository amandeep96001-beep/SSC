import React from 'react';

export function PerformanceWorkspace({ user }) {
  const progressCount = user.progress?.length || 0;
  const averageScore = progressCount > 0 
    ? Math.round(user.progress.reduce((sum, curr) => sum + curr.score, 0) / progressCount) 
    : 0;
  const masteredCount = user.progress?.filter(p => p.status === 'green').length || 0;
  const reviewingCount = user.progress?.filter(p => p.status === 'yellow').length || 0;
  const revisionNeededCount = user.progress?.filter(p => p.status === 'red').length || 0;

  return (
    <div className="study-workspace">
      <div className="section-header">
        <h1>Performance Analytics Dashboard</h1>
        <p>Track your target concepts, average mock scores, and revision statistics.</p>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Tests Completed</span>
          <span className="stat-val">{progressCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Average Score</span>
          <span className="stat-val score-blue">{averageScore} / 50</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Mastered (Green)</span>
          <span className="stat-val score-green">{masteredCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Reviewing (Yellow)</span>
          <span className="stat-val score-yellow">{reviewingCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Needs Help (Red)</span>
          <span className="stat-val score-red">{revisionNeededCount}</span>
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
                  <th>Completion Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {user.progress.map((record, i) => (
                  <tr key={i}>
                    <td><code>{record.topicId}</code></td>
                    <td><strong>{record.score} / 50</strong></td>
                    <td>
                      <span className={`status-badge-pill ${record.status}`}>
                        {record.status === 'green' && 'Mastered'}
                        {record.status === 'yellow' && 'Reviewing'}
                        {record.status === 'red' && 'Action Needed'}
                      </span>
                    </td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
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
    </div>
  );
}
