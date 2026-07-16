import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Swords, Trophy, Target, Zap, Clock, CheckCircle2, XCircle, 
  SkipForward, RefreshCw, ChevronRight, Medal, Crown, Timer, Award, Shuffle
} from 'lucide-react';
import { apiService } from '@/shared/services/apiService';

const SUBJECTS = ['Mixed', 'GK', 'English', 'Maths', 'Reasoning'];
const QUESTION_LIMIT = 20;
const TIME_PER_QUESTION = 45; // seconds

const SUBJECT_COLORS = {
  Mixed:     { primary: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)' },
  GK:        { primary: '#34c759', bg: 'rgba(52, 199, 89, 0.1)' },
  English:   { primary: '#5856d6', bg: 'rgba(88, 86, 214, 0.1)' },
  Maths:     { primary: '#ff9f0a', bg: 'rgba(255, 159, 10, 0.1)' },
  Reasoning: { primary: '#bf4800', bg: 'rgba(191, 72, 0, 0.08)' }
};

// ── Screen States ─────────────────────────────────────────────────
// 'start' → 'loading' → 'quiz' → 'submitting' → 'result'

export function CompetitionWorkspace({ user }) {
  const [screen, setScreen]           = useState('start');
  const [selectedSubject, setSelectedSubject] = useState('Mixed');
  const [questions, setQuestions]     = useState([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [userAnswers, setUserAnswers]  = useState([]); // array of chosen option index or null
  const [timeLeft, setTimeLeft]        = useState(TIME_PER_QUESTION);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [resultData, setResultData]    = useState(null);
  const [leaderboard, setLeaderboard]  = useState([]);
  const [loadingLeader, setLoadingLeader] = useState(false);
  const [error, setError]              = useState('');
  const [answered, setAnswered]        = useState(false); // show feedback on current question

  const timerRef   = useRef(null);
  const startTimeRef = useRef(null);
  const nextTimeoutRef = useRef(null);
  const userAnswersRef = useRef([]);

  const clearNextTimeout = () => {
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }
  };

  // ── Timer Logic ───────────────────────────────────────────────────
  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  // ── Fetch Leaderboard ─────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeader(true);
    try {
      const res = await apiService.get(`/competition/leaderboard?subject=${selectedSubject}`);
      if (res.status === 'success') setLeaderboard(res.data);
    } catch { /* silent fail */ }
    finally { setLoadingLeader(false); }
  }, [selectedSubject]);

  // ── POST score to backend ─────────────────────────────────────────
  const submitScore = useCallback(async ({ correct, wrong, skipped, accuracy, score, timeTaken, answers }) => {
    try {
      const res = await apiService.post('/competition/submit', {
        username: user?.username || 'Guest',
        subject: selectedSubject,
        score, correct, wrong, skipped, accuracy, timeTaken
      });

      if (res.status === 'success') {
        setResultData({ ...res.data, correct, wrong, skipped, accuracy, score, timeTaken, answers });
        fetchLeaderboard();
        setScreen('result');
      } else {
        throw new Error(res.message || 'Score submission failed on the server.');
      }
    } catch (err) {
      setError(err.message || 'Could not save score to leaderboard. Displaying results offline.');
      // Even if submission fails, show result locally
      setResultData({ correct, wrong, skipped, accuracy, score, timeTaken, answers, rank: null });
      setScreen('result');
    }
  }, [user, selectedSubject, fetchLeaderboard]);

  // ── Compute results & submit ──────────────────────────────────────
  const finishBattle = useCallback(() => {
    clearTimer();
    clearNextTimeout();
    const taken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTotalTimeTaken(taken);

    const finalAnswers = [...userAnswersRef.current];
    // fill any remaining unanswered as null
    for (let i = 0; i < questions.length; i++) {
      if (finalAnswers[i] === undefined) finalAnswers[i] = null;
    }

    const correct = questions.filter((q, i) => finalAnswers[i] === q.correctAnswer).length;
    const wrong   = questions.filter((q, i) => finalAnswers[i] !== null && finalAnswers[i] !== q.correctAnswer).length;
    const skipped = questions.filter((q, i) => finalAnswers[i] === null).length;
    
    let accuracy = 0;
    if (questions.length > 0) {
      accuracy = Math.round((correct / questions.length) * 100);
    }
    if (isNaN(accuracy)) accuracy = 0;

    const score = correct;

    setUserAnswers(finalAnswers);
    setScreen('submitting');
    submitScore({ correct, wrong, skipped, accuracy, score, timeTaken: taken, answers: finalAnswers });
  }, [questions, submitScore]);

  // ── Move to next question or finish ──────────────────────────────
  const moveToNext = useCallback(() => {
    clearNextTimeout();
    setAnswered(false);

    setCurrentIdx(prev => {
      if (prev + 1 >= questions.length) {
        setTimeout(() => finishBattle(), 0);
        return prev;
      }
      return prev + 1;
    });
  }, [questions.length, finishBattle]);

  // ── Auto-skip when timer hits 0 ───────────────────────────────────
  const handleAutoSkip = useCallback(() => {
    setUserAnswers(prev => {
      const updated = [...prev];
      if (updated[currentIdx] === undefined) updated[updated.length - 1 < currentIdx ? updated.length : currentIdx] = null; // null = skipped/timed-out
      userAnswersRef.current = updated;
      return updated;
    });
    setAnswered(true);
    clearNextTimeout();
    nextTimeoutRef.current = setTimeout(() => moveToNext(), 1000);
  }, [currentIdx, moveToNext]);

  // ── Start Competition ─────────────────────────────────────────────
  const startBattle = async () => {
    setError('');
    clearNextTimeout();
    setScreen('loading');
    try {
      const res = await apiService.get(`/competition/questions?subject=${selectedSubject}&limit=${QUESTION_LIMIT}`);
      if (res.status === 'success' && res.data.length > 0) {
        const initialAnswers = new Array(res.data.length).fill(undefined);
        setQuestions(res.data);
        setUserAnswers(initialAnswers);
        userAnswersRef.current = initialAnswers;
        setCurrentIdx(0);
        setAnswered(false);
        setTotalTimeTaken(0);
        startTimeRef.current = Date.now();
        setScreen('quiz');
      } else {
        throw new Error('Unable to load questions. Please ensure the database has been seeded with TCS PYQ questions.');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to the server. Please verify if the backend is running.');
      setScreen('start');
    }
  };

  // ── Answer Selection ──────────────────────────────────────────────
  const handleAnswer = (optionIdx) => {
    if (answered) return;
    clearTimer();
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentIdx] = optionIdx;
      userAnswersRef.current = updated;
      return updated;
    });
    setAnswered(true);
    clearNextTimeout();
    nextTimeoutRef.current = setTimeout(() => moveToNext(), 1200);
  };

  // ── Timer Logic ───────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoSkip]);

  useEffect(() => {
    if (screen === 'quiz') startTimer();
    return clearTimer;
  }, [screen, currentIdx, startTimer]);

  useEffect(() => { return () => { clearTimer(); clearNextTimeout(); }; }, []);

  // ── Reset to start ────────────────────────────────────────────────
  const resetToStart = () => {
    clearTimer();
    clearNextTimeout();
    setScreen('start');
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswers([]);
    userAnswersRef.current = [];
    setAnswered(false);
    setResultData(null);
    setLeaderboard([]);
    setError('');
  };

  const color = SUBJECT_COLORS[selectedSubject] || SUBJECT_COLORS.Mixed;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: START SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'start') {
    return (
      <div className="competition-start-screen">
        <div className="competition-hero">
          <div className="competition-hero-icon"><Swords size={40} /></div>
          <h1 className="competition-hero-title">MCQ Battle Mode</h1>
          <p className="competition-hero-sub">
            {QUESTION_LIMIT} questions · {TIME_PER_QUESTION}s per question · Fastest wins
          </p>
        </div>

        {error && (
          <div className="competition-error-banner">
            <XCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <div className="competition-subject-selector">
          <p className="competition-label">Choose your subject:</p>
          <div className="competition-subject-grid">
            {SUBJECTS.map(sub => (
              <button
                key={sub}
                className={`competition-subject-btn ${selectedSubject === sub ? 'selected' : ''}`}
                style={selectedSubject === sub ? { borderColor: SUBJECT_COLORS[sub].primary, background: SUBJECT_COLORS[sub].bg, color: SUBJECT_COLORS[sub].primary } : {}}
                onClick={() => setSelectedSubject(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <button className="competition-start-btn" onClick={startBattle}
          style={{ background: color.primary }}>
          <Swords size={20} /> Start Battle
        </button>

        <div className="competition-stats-row">
          <div className="competition-stat-box"><Target size={18} /><span>{QUESTION_LIMIT} Questions</span></div>
          <div className="competition-stat-box"><Clock size={18} /><span>{TIME_PER_QUESTION}s per Q</span></div>
          <div className="competition-stat-box"><Trophy size={18} /><span>Live Leaderboard</span></div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: LOADING / SUBMITTING
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'loading' || screen === 'submitting') {
    return (
      <div className="competition-loading-screen">
        <div className="loader-glowing-ring">
          <Swords className="loader-center-icon" size={28} />
        </div>
        <h3 className="loading-text">
          {screen === 'loading' ? 'Preparing Battle Arena...' : 'Analyzing Battle Performance...'}
        </h3>
        <p className="loading-subtext">
          {screen === 'loading' 
            ? 'Fetching matching TCS PYQs from database...' 
            : 'Submitting your score to the global leaderboard...'}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: QUIZ SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'quiz' && questions.length > 0) {
    const q = questions[currentIdx];

    // Safety guard: async state transition ke waqt currentIdx temporarily out-of-bounds ho sakta hai
    if (!q) {
      return (
        <div className="competition-loading-screen">
          <div className="loader-glowing-ring">
            <Swords className="loader-center-icon" size={28} />
          </div>
          <h3 className="loading-text">Preparing next question...</h3>
        </div>
      );
    }

    const timerPct = (timeLeft / TIME_PER_QUESTION) * 100;
    const timerColor = timeLeft > 15 ? '#10b981' : timeLeft > 7 ? '#f59e0b' : '#ef4444';


    return (
      <div className="competition-quiz-screen">
        {/* ── Header bar ── */}
        <div className="battle-header">
          <div className="battle-progress-info">
            <span className="battle-q-counter">Q {currentIdx + 1} / {questions.length}</span>
            <span className="battle-subject-badge" style={{ background: color.bg, color: color.primary }}>
              {q.subject}
            </span>
          </div>
          <div className="battle-timer-display" style={{ color: timerColor }}>
            <Timer size={16} />
            <span className="battle-timer-number">{timeLeft}s</span>
          </div>
        </div>

        {/* ── Timer bar ── */}
        <div className="battle-timer-track">
          <div 
            className="battle-timer-fill"
            style={{ width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear, background 0.5s ease' }}
          />
        </div>

        {/* ── Question card ── */}
        <div className="battle-question-card">
          <p className="battle-question-category">{q.category}</p>
          <h2 className="battle-question-text">{q.question}</h2>

          <div className="battle-options-grid">
            {q.options.map((opt, idx) => {
              let cls = 'battle-option-btn';
              if (answered) {
                if (idx === q.correctAnswer) cls += ' correct';
                else if (idx === userAnswers[currentIdx] && idx !== q.correctAnswer) cls += ' wrong';
              }
              return (
                <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={answered}>
                  <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{opt}</span>
                  {answered && idx === q.correctAnswer && <CheckCircle2 size={16} className="option-check" />}
                  {answered && idx === userAnswers[currentIdx] && idx !== q.correctAnswer && <XCircle size={16} className="option-x" />}
                </button>
              );
            })}
          </div>

          {answered && q.explanation && (
            <div className="battle-explanation-box">
              <span className="battle-exp-label">Explanation:</span> {q.explanation}
            </div>
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div className="battle-bottom-bar">
          <div className="battle-score-live">
            <CheckCircle2 size={15} className="live-correct-icon" />
            <span>{questions.slice(0, currentIdx).filter((q2, i) => userAnswers[i] === q2.correctAnswer).length} Correct</span>
          </div>
          {!answered && (
            <button className="battle-skip-btn" onClick={() => { clearTimer(); handleAutoSkip(); }}>
              <SkipForward size={15} /> Skip
            </button>
          )}
          {answered && currentIdx + 1 < questions.length && (
            <button className="battle-next-btn" onClick={moveToNext}
              style={{ background: color.primary, color: '#fff' }}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'result' && resultData) {
    const { correct, wrong, skipped, accuracy, score, timeTaken, rank } = resultData;
    const isPerfect = correct === QUESTION_LIMIT;
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;

    return (
      <div className="competition-result-screen">
        {/* ── Score card ── */}
        <div className="battle-result-card" style={{ borderTop: `4px solid ${color.primary}` }}>
          <div className="result-trophy-icon" style={{ color: color.primary }}>
            {isPerfect ? <Crown size={40} /> : <Trophy size={40} />}
          </div>
          <h2 className="result-title">{isPerfect ? 'Perfect Score!' : 'Battle Complete!'}</h2>
          <div className="result-score-display" style={{ color: color.primary }}>
            {score} <span className="result-score-total">/ {QUESTION_LIMIT}</span>
          </div>

          <div className="result-stats-grid">
            <div className="result-stat correct-stat">
              <CheckCircle2 size={18} />
              <span className="rs-val">{correct}</span>
              <span className="rs-label">Correct</span>
            </div>
            <div className="result-stat wrong-stat">
              <XCircle size={18} />
              <span className="rs-val">{wrong}</span>
              <span className="rs-label">Wrong</span>
            </div>
            <div className="result-stat skip-stat">
              <SkipForward size={18} />
              <span className="rs-val">{skipped}</span>
              <span className="rs-label">Skipped</span>
            </div>
            <div className="result-stat time-stat">
              <Clock size={18} />
              <span className="rs-val">{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</span>
              <span className="rs-label">Time</span>
            </div>
            <div className="result-stat acc-stat">
              <Target size={18} />
              <span className="rs-val">{accuracy}%</span>
              <span className="rs-label">Accuracy</span>
            </div>
            {rank && (
              <div className="result-stat rank-stat" style={{ color: color.primary }}>
                <Medal size={18} />
                <span className="rs-val">#{rank}</span>
                <span className="rs-label">Your Rank</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Leaderboard ── */}
        <div className="leaderboard-section">
          <h3 className="leaderboard-title"><Trophy size={18} /> {selectedSubject} Leaderboard — Top 10</h3>
          {loadingLeader ? (
            <div className="competition-loading-screen" style={{ padding: '20px' }}>
              <RefreshCw className="spin-icon" size={20} />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="leaderboard-empty">No scores recorded yet. Be the first to claim the top spot!</p>
          ) : (
            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.username === user.username;
                    const t = entry.bestTimeTaken || 0;
                    const tm = Math.floor(t / 60);
                    const ts = t % 60;
                    return (
                      <tr key={entry.username} className={`leaderboard-row ${isMe ? 'my-row' : ''}`}>
                        <td className="rank-cell">
                          {i === 0 ? <Medal size={20} className="rank-medal rank-medal--gold" strokeWidth={1.75} />
                            : i === 1 ? <Medal size={20} className="rank-medal rank-medal--silver" strokeWidth={1.75} />
                            : i === 2 ? <Award size={20} className="rank-medal rank-medal--bronze" strokeWidth={1.75} />
                            : <span className="rank-num">#{i + 1}</span>}
                        </td>
                        <td className="username-cell">{entry.username}{isMe ? ' (You)' : ''}</td>
                        <td className="score-cell">{entry.bestScore}/{QUESTION_LIMIT}</td>
                        <td>{entry.bestAccuracy}%</td>
                        <td>{tm > 0 ? `${tm}m ${ts}s` : `${ts}s`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="result-actions">
          <button className="battle-again-btn" onClick={startBattle}
            style={{ background: color.primary }}>
            <Swords size={18} /> Battle Again
          </button>
          <button className="battle-home-btn" onClick={resetToStart}>
            <Shuffle size={16} strokeWidth={2} /> Change Subject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
