
export function Header({ connection }) {
  const { isOnline, dbStatus } = connection;

  return (
    <header className="app-header">
      <div className="brand-section">
        <h1>🎯 Exam Preparation Portal</h1>
        <p>Production-Ready Workspace for CGL & CHSL Prep</p>
      </div>
      <div className="status-badge-container">
        <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>
            {isOnline 
              ? `API Online (DB: ${dbStatus})` 
              : 'API Server Offline'
            }
          </span>
        </div>
      </div>
    </header>
  );
}
