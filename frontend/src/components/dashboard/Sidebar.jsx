import { 
  GraduationCap, 
  UserCheck, 
  LogOut, 
  Zap, 
  BookMarked, 
  Book, 
  Trophy,
  Activity,
  PieChart
} from 'lucide-react';

export function Sidebar({
  user,
  logoutUser,
  isOnline,
  activeView,
  setActiveView,
  skipToSubjects
}) {
  return (
    <aside className="lms-sidebar">
      <div className="sidebar-brand">
        <GraduationCap className="brand-icon" size={28} />
        <div className="brand-text">
          <h2>SSC Prep Portal</h2>
          <span>CGL & CHSL Speed Engine</span>
        </div>
      </div>

      <div className="user-profile-card">
        <div className="avatar-icon">
          <UserCheck size={20} />
        </div>
        <div className="user-details">
          <span className="username-label">{user.username}</span>
          <button className="btn-logout" onClick={logoutUser}>
            <LogOut size={12} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      <div className="connection-card">
        <div className={`status-dot ${isOnline ? 'connected' : 'disconnected'}`}></div>
        <div className="connection-info">
          <span className="status-label">Database</span>
          <span className="status-text">{isOnline ? 'Atlas Connected' : 'Offline Mode'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeView === 'drill' ? 'active' : ''}`}
          onClick={() => setActiveView('drill')}
        >
          <Zap className="nav-icon" size={18} />
          <span>Speed Drills</span>
        </button>
        
        <button 
          className={`nav-item ${['subjects', 'topics', 'notes'].includes(activeView) ? 'active' : ''}`}
          onClick={() => skipToSubjects()}
        >
          <BookMarked className="nav-icon" size={18} />
          <span>Syllabus & Notes</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'revision' ? 'active' : ''}`}
          onClick={() => setActiveView('revision')}
        >
          <Book className="nav-icon" size={18} />
          <span>Revision Deck</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'mock' ? 'active' : ''}`}
          onClick={() => setActiveView('mock')}
        >
          <Activity className="nav-icon" size={18} />
          <span>Full Mocks</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveView('performance')}
        >
          <Trophy className="nav-icon" size={18} />
          <span>Performance Tracker</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          <PieChart className="nav-icon" size={18} />
          <span>Insights & Analytics</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <span className="version-label">v1.4.0 Tracking Enabled</span>
      </div>
    </aside>
  );
}
