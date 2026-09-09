import { 
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
  Moon,
  Home,
  Shield,
  Bell,
  Map
} from 'lucide-react';
import { useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME } from '@/shared/brand';
import type { AppUser } from '@/types/app';

interface SidebarProps {
  user: AppUser | null;
  logoutUser: () => void;
  activeView: string;
  setActiveView: (view: string, options?: Record<string, unknown>) => void;
  skipToSubjects: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
}

export function Sidebar({
  user,
  logoutUser,
  activeView,
  setActiveView,
  skipToSubjects,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
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
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', clearProps: 'all' }
    );
    gsap.fromTo('.user-profile-card',
      { x: -18, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, delay: 0.12, ease: 'power3.out', clearProps: 'all' }
    );
    gsap.fromTo('.nav-item',
      { x: -22, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, stagger: 0.055, delay: 0.22, ease: 'power3.out', clearProps: 'all' }
    );
    gsap.fromTo('.sidebar-footer',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.55, ease: 'power2.out', clearProps: 'all' }
    );
  }, { scope: sidebarRef });

  const go = (view: string) => {
    setActiveView(view);
    setIsMobileOpen(false);
  };

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
        <div className="brand-mark" aria-hidden="true" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <img src="/logo.png" alt="ExamPrep Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
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
          <span className="username-label">{user?.username}</span>
          <button className="btn-logout" onClick={logoutUser}>
            <LogOut size={12} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => go('home')}
        >
          <Home className="nav-icon" size={18} strokeWidth={1.75} />
          <span>What to Study</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'reminders' ? 'active' : ''}`}
          onClick={() => go('reminders')}
        >
          <Bell className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Reminders</span>
        </button>

        {user?.role === 'admin' && (
          <button 
            className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => go('admin')}
          >
            <Shield className="nav-icon" size={18} strokeWidth={1.75} />
            <span>Exam subjects</span>
          </button>
        )}

        <button 
          className={`nav-item ${activeView === 'drill' ? 'active' : ''}`}
          onClick={() => go('drill')}
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
          className={`nav-item ${activeView === 'roadmap' ? 'active' : ''}`}
          onClick={() => go('roadmap')}
        >
          <Map className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Syllabus Roadmap</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'revision' ? 'active' : ''}`}
          onClick={() => go('revision')}
        >
          <Layers className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Revision Deck</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'mock' ? 'active' : ''}`}
          onClick={() => go('mock')}
        >
          <ClipboardList className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Full Mocks</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => go('performance')}
        >
          <Award className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Performance</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => go('analytics')}
        >
          <PieChart className="nav-icon" size={18} strokeWidth={1.75} />
          <span>Analytics</span>
        </button>

        <button 
          className={`nav-item competition-nav-item ${activeView === 'competition' ? 'active' : ''}`}
          onClick={() => go('competition')}
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
      </div>
    </aside>
    </>
  );
}
