import { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, ArrowRight } from 'lucide-react';

interface CountdownProps {
  onGoToDashboard: () => void;
}

interface ExamTarget {
  id: string;
  name: string;
  stage: string;
  targetDate: string; // ISO date string
  status: string;
  badgeColor: string;
  posts: string;
}

const UPCOMING_EXAMS: ExamTarget[] = [
  {
    id: 'cgl-2026',
    name: 'SSC CGL 2026',
    stage: 'Tier-1 CBT',
    targetDate: '2026-11-15T09:00:00',
    status: 'Official Notification Active',
    badgeColor: 'brand',
    posts: 'Inspector, ASO, Tax Assistant (Group B & C)',
  },
  {
    id: 'chsl-2026',
    name: 'SSC CHSL 2026',
    stage: 'Tier-1 CBT',
    targetDate: '2026-12-05T09:00:00',
    status: 'Application Window Scheduled',
    badgeColor: 'cyan',
    posts: 'LDC, JSA, Data Entry Operator (10+2 Level)',
  },
  {
    id: 'gd-2026',
    name: 'SSC GD Constable 2026',
    stage: 'Computer Based Exam',
    targetDate: '2027-01-20T09:00:00',
    status: 'Upcoming Mega Recruitment',
    badgeColor: 'emerald',
    posts: 'BSF, CISF, CRPF, SSB, ITBP, AR, SSF',
  },
  {
    id: 'cpo-2026',
    name: 'SSC CPO 2026',
    stage: 'Paper-1 Exam',
    targetDate: '2026-10-25T09:00:00',
    status: 'Revision & Mock Phase',
    badgeColor: 'amber',
    posts: 'Sub-Inspector in Delhi Police & CAPFs',
  },
];

function getTimeRemaining(targetDate: string) {
  const total = Date.parse(targetDate) - Date.now();
  const seconds = Math.max(0, Math.floor((total / 1000) % 60));
  const minutes = Math.max(0, Math.floor((total / 1000 / 60) % 60));
  const hours = Math.max(0, Math.floor((total / (1000 * 60 * 60)) % 24));
  const days = Math.max(0, Math.floor(total / (1000 * 60 * 60 * 24)));
  return { total, days, hours, minutes, seconds };
}

export function ExamCountdownWidget({ onGoToDashboard }: CountdownProps) {
  const [selectedExamId, setSelectedExamId] = useState('cgl-2026');
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeRemaining(UPCOMING_EXAMS[0].targetDate)
  );

  const currentExam =
    UPCOMING_EXAMS.find((e) => e.id === selectedExamId) ?? UPCOMING_EXAMS[0];

  useEffect(() => {
    setTimeLeft(getTimeRemaining(currentExam.targetDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(currentExam.targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentExam.targetDate]);

  return (
    <div className="lp-countdown-widget" id="exam-calendar">
      <div className="lp-countdown-header">
        <div className="lp-countdown-tag">
          <Clock size={14} />
          <span>SSC 2026 Official Calendar Radar</span>
        </div>
        <h3 className="lp-countdown-title">
          Countdown to Target Exam: Every Day Counts
        </h3>
        <p className="lp-countdown-desc">
          Competition is intense: 30 Lakh+ applicants fight for top posts. A daily routine of 1 Mock + Speed Drill + Revision ensures selection.
        </p>

        {/* Exam Tabs */}
        <div className="lp-countdown-tabs" role="tablist">
          {UPCOMING_EXAMS.map((exam) => (
            <button
              key={exam.id}
              type="button"
              className={`lp-countdown-tab ${exam.id === selectedExamId ? 'is-active' : ''}`}
              onClick={() => setSelectedExamId(exam.id)}
            >
              <Calendar size={14} />
              <span>{exam.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lp-countdown-card">
        <div className="lp-countdown-meta-row">
          <div>
            <span className="lp-exam-badge">{currentExam.status}</span>
            <h4 className="lp-countdown-exam-name">
              {currentExam.name} • {currentExam.stage}
            </h4>
            <p className="lp-countdown-posts">{currentExam.posts}</p>
          </div>
          <button
            type="button"
            className="lp-countdown-cta-btn"
            onClick={onGoToDashboard}
          >
            <span>Start Practice Mock</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Timer Blocks */}
        <div className="lp-timer-grid">
          <div className="lp-timer-unit">
            <span className="lp-timer-number">{timeLeft.days}</span>
            <span className="lp-timer-label">DAYS</span>
          </div>
          <div className="lp-timer-colon">:</div>
          <div className="lp-timer-unit">
            <span className="lp-timer-number">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="lp-timer-label">HOURS</span>
          </div>
          <div className="lp-timer-colon">:</div>
          <div className="lp-timer-unit">
            <span className="lp-timer-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="lp-timer-label">MINS</span>
          </div>
          <div className="lp-timer-colon">:</div>
          <div className="lp-timer-unit">
            <span className="lp-timer-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="lp-timer-label">SECS</span>
          </div>
        </div>

        <div className="lp-countdown-tip">
          <Bell size={15} className="lp-tip-bell" />
          <span>
            <strong>Pro Tip:</strong> Consistent candidates who attempt 20+ full-length mocks score on average <strong>32 marks higher</strong> than those relying solely on video lectures.
          </span>
        </div>
      </div>
    </div>
  );
}
