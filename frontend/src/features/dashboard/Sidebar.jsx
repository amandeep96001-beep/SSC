import { 
  GraduationCap, 
  UserCheck, 
  LogOut, 
  Zap, 
  BookMarked, 
  Layers, 
  Award,
  ClipboardList,
  PieChart,
  Swords,
  Sun,
  Moon
} from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME, APP_VERSION } from '@/shared/brand';

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
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    document.documentElement.classList.add('sidebar-open');
    return () => {
      document.documentElement.classList.remove('sidebar-open');
    };
  }, [isMobileOpen]);

  useGSAP(() => {
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
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.4, ease: 'power2.out', clearProps: 'all' }
    );
    gsap.fromTo('.sidebar-footer', 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.8, delay: 1, clearProps: 'all' }
    );
  }, { scope: sidebarRef });

  return (
    <>
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
      <aside ref={sidebarRef} className={`lms-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap className="brand-icon" size={22} />
        </div>
        <div className="brand-text">
          <h2>{APP_NAME}</h2>
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
          <span className="status-label">Sync status</span>
          <span className="status-text">{isOnline ? 'Connected' : 'Offline'}</span>
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
          <Zap className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Daily Drills</span>
        </button>
        
        <button 
          className={`nav-item ${['subjects', 'topics', 'notes'].includes(activeView) ? 'active' : ''}`}
          onClick={() => {
            skipToSubjects();
            setIsMobileOpen(false);
          }}
        >
          <BookMarked className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Syllabus & Notes</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'revision' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('revision');
            setIsMobileOpen(false);
          }}
        >
          <Layers className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Revision Deck</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'mock' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('mock');
            setIsMobileOpen(false);
          }}
        >
          <ClipboardList className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Full Mocks</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('performance');
            setIsMobileOpen(false);
          }}
        >
          <Award className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Performance</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('analytics');
            setIsMobileOpen(false);
          }}
        >
          <PieChart className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Analytics</span>
        </button>

        <button 
          className={`nav-item competition-nav-item ${activeView === 'competition' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('competition');
            setIsMobileOpen(false);
          }}
        >
          <Swords className="nav-icon" size={18} strokeWidth={1.75} />
          <span>MCQ Battle</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={14} className="theme-toggle-icon" /> : <Moon size={14} className="theme-toggle-icon" />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
        <span className="version-label">{APP_NAME} v{APP_VERSION}</span>
      </div>
    </aside>
    </>
  );
}
