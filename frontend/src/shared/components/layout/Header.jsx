export function Header({ connection }) {
  const { isOnline, dbStatus } = connection;

  return (
    <header className="app-header">
      <div className="brand-section">
        <h1>ExamPrep</h1>
      </div>
      <div className="status-badge-container">
        <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>
            {isOnline 
              ? `Online${dbStatus ? ` · ${dbStatus}` : ''}` 
              : 'Offline'
            }
          </span>
        </div>
      </div>
    </header>
  );
}
