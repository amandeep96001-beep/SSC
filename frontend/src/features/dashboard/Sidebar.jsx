import { 
  GraduationCap, 
  UserCheck, 
  LogOut, 
  Zap, 
  BookMarked, 
  Book, 
  Trophy,
  Activity,
  PieChart,
  Swords
} from 'lucide-react';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function Sidebar({
  user,
  logoutUser,
  isOnline,
  activeView,
  setActiveView,
  skipToSubjects,
  isMobileOpen,
  setIsMobileOpen
}) {
  const sidebarRef = useRef(null);

  useGSAP(() => {
    // Elegant entrance animation
    gsap.fromTo('.sidebar-brand', 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'all' }
    );
    gsap.fromTo('.user-profile-card, .connection-card', 
      { x: -20, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.2, ease: 'power2.out', clearProps: 'all' }
    );
    gsap.fromTo('.nav-item', 
      { x: -30, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.4, ease: 'back.out(1.2)', clearProps: 'all' }
    );
    gsap.fromTo('.sidebar-footer', 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.8, delay: 1, clearProps: 'all' }
    );
  }, { scope: sidebarRef });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
      <aside ref={sidebarRef} className={`lms-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <GraduationCap className="brand-icon" size={28} />
        <div className="brand-text">
          <h2>SSC Prep</h2>
          <span>CGL · CHSL · MTS</span>
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
          onClick={() => {
            setActiveView('drill');
            setIsMobileOpen(false);
          }}
        >
          <Zap className="nav-icon" size={18} />
          <span>Speed Drills</span>
        </button>
        
        <button 
          className={`nav-item ${['subjects', 'topics', 'notes'].includes(activeView) ? 'active' : ''}`}
          onClick={() => {
            skipToSubjects();
            setIsMobileOpen(false);
          }}
        >
          <BookMarked className="nav-icon" size={18} />
          <span>Syllabus & Notes</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'revision' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('revision');
            setIsMobileOpen(false);
          }}
        >
          <Book className="nav-icon" size={18} />
          <span>Revision Deck</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'mock' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('mock');
            setIsMobileOpen(false);
          }}
        >
          <Activity className="nav-icon" size={18} />
          <span>Full Mocks</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('performance');
            setIsMobileOpen(false);
          }}
        >
          <Trophy className="nav-icon" size={18} />
          <span>Performance Tracker</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('analytics');
            setIsMobileOpen(false);
          }}
        >
          <PieChart className="nav-icon" size={18} />
          <span>Insights & Analytics</span>
        </button>

        <button 
          className={`nav-item competition-nav-item ${activeView === 'competition' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('competition');
            setIsMobileOpen(false);
          }}
        >
          <Swords className="nav-icon" size={18} />
          <span>MCQ Battle</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <span className="version-label">SSC Prep v2.0</span>
      </div>
    </aside>
    </>
  );
}
