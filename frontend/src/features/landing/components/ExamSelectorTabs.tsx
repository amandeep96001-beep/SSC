import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, Layers, Target } from 'lucide-react';
import { EXAMS_LIST } from '../data/examInfo';

interface ExamSelectorTabsProps {
  onGoToDashboard: () => void;
}

export function ExamSelectorTabs({ onGoToDashboard }: ExamSelectorTabsProps) {
  const [activeExamId, setActiveExamId] = useState(EXAMS_LIST[0].id);

  const currentExam = EXAMS_LIST.find((e) => e.id === activeExamId) || EXAMS_LIST[0];

  return (
    <section id="exams" className="lp-section lp-exams-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">Which SSC exams are covered here?</h2>
        <p className="lp-section-lead">
          Each SSC exam has its own pattern. The figures below come from the latest official notice.
          Open the syllabus section for topics, then practise those subjects in the app.
        </p>
      </div>

      <div className="lp-exams-container">
        {/* Exam Selectors */}
        <div className="lp-exam-pills" role="tablist">
          {EXAMS_LIST.map((exam) => {
            const isActive = exam.id === activeExamId;
            return (
              <button
                key={exam.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`lp-exam-pill-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveExamId(exam.id)}
              >
                <span className="lp-pill-name">{exam.name}</span>
                {exam.badge && <span className="lp-pill-status">{exam.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Selected Exam Dashboard Card */}
        <div className="lp-exam-display-card">
          <div className="lp-edc-header">
            <div>
              <div className="lp-edc-sub">As per the official notice</div>
              <h3 className="lp-edc-title">{currentExam.name}</h3>
            </div>
            <button
              type="button"
              className="lp-btn-exam-start"
              onClick={onGoToDashboard}
            >
              <span>Practice this exam</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <p className="lp-edc-desc">{currentExam.description}</p>

          {/* Stats Bar */}
          <div className="lp-edc-stats-grid">
            {currentExam.stats.map((stat, i) => (
              <div key={i} className="lp-edc-stat-cell">
                <span className="lp-edc-stat-val">{stat.value}</span>
                <span className="lp-edc-stat-lbl">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Two Columns: Subjects & Stages */}
          <div className="lp-edc-two-col">
            <div className="lp-edc-col">
              <div className="lp-col-heading">
                <Target size={15} className="lp-col-icon text-indigo" />
                <span>Major subjects</span>
              </div>
              <div className="lp-subject-tags">
                {currentExam.subjects.map((sub, i) => (
                  <div key={i} className="lp-subject-tag">
                    <CheckCircle2 size={13} className="text-emerald" />
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-edc-col">
              <div className="lp-col-heading">
                <Layers size={15} className="lp-col-icon text-amber" />
                <span>Selection process</span>
              </div>
              <div className="lp-stage-timeline">
                {currentExam.stages.map((stage, i) => (
                  <div key={i} className="lp-stage-item">
                    <span className="lp-stage-idx">0{i + 1}</span>
                    <span className="lp-stage-text">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {currentExam.source && (
            <p className="lp-source-line">
              Source:{' '}
              <a href={currentExam.source.url} target="_blank" rel="noreferrer">
                {currentExam.source.label}
              </a>
              . The next notification may change the pattern.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
