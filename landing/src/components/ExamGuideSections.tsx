import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import {
  COMMON_SUBJECTS,
  CONTENT_VERIFIED,
  PREP_STEPS,
  RAILWAY_EXAMS,
  SSC_PROCESSES,
  SSC_SYLLABUS,
  TIER_CARDS,
} from '../data/examInfo';

interface GuideProps {
  onGoToDashboard: () => void;
}

export function PrepIntro() {
  return (
    <section id="how-to-start" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">How to prepare for SSC</h2>
        <p className="lp-section-lead">
          Choose one target exam first. Read that exam’s pattern and syllabus. Break subjects into topics,
          practise questions, solve previous year papers, take mocks, and revise mistakes.
        </p>
      </div>
      <ol className="lp-guide-points">
        {[
          'Lock one exam — CGL, CHSL, GD, CPO and MTS do not share the same process.',
          'Use the official notice: which paper is screening, which builds merit, and where DEST, typing or PET is qualifying.',
          'Split the syllabus into topics. Finish one subject before jumping to the next.',
          'Solve questions after each topic. Notes alone are not enough.',
          'Previous year questions show how a concept is actually asked.',
          'Practise with a timer. Keep section time as close to the notice as you can.',
          'After a mock, do not stop at the score — list wrong and slow topics, then revise those first.',
        ].map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <p className="lp-verified-note">
        Last verified {CONTENT_VERIFIED.lastVerifiedAt}. {CONTENT_VERIFIED.disclaimer}
      </p>
    </section>
  );
}

export function ExamProcess({ onGoToDashboard }: GuideProps) {
  const [active, setActive] = useState(SSC_PROCESSES[0].id);
  const current = SSC_PROCESSES.find((item) => item.id === active) ?? SSC_PROCESSES[0];

  return (
    <section id="process" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">SSC selection process</h2>
        <p className="lp-section-lead">
          There is no single process for all SSC exams. Each exam below follows its own official notice.
        </p>
      </div>
      <div className="lp-exam-pills" role="tablist">
        {SSC_PROCESSES.map((exam) => (
          <button
            key={exam.id}
            type="button"
            role="tab"
            aria-selected={exam.id === active}
            className={`lp-exam-pill-btn ${exam.id === active ? 'is-active' : ''}`}
            onClick={() => setActive(exam.id)}
          >
            {exam.name}
          </button>
        ))}
      </div>
      <ol className="lp-flow">
        {current.steps.map((step, index) => (
          <li key={step.label} className="lp-flow-step">
            <span className="lp-flow-index">{index + 1}</span>
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </li>
        ))}
      </ol>
      <p className="lp-verified-note">{current.caution}</p>
      <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
        Attempt a mock for this process <ArrowRight size={14} />
      </button>
    </section>
  );
}

export function SyllabusBoard({ onGoToDashboard }: GuideProps) {
  const [openExam, setOpenExam] = useState<string>('cgl');
  const [openStage, setOpenStage] = useState<string>('cgl-t1');

  return (
    <section id="syllabus" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">SSC syllabus — what to study</h2>
        <p className="lp-section-lead">
          There is no one SSC syllabus. Each exam below uses the indicative syllabus from its official notice.
          Expand a stage for topics.
        </p>
      </div>
      <div className="lp-faq-container lp-syllabus-list">
        {SSC_SYLLABUS.map((exam) => {
          const examOpen = openExam === exam.id;
          return (
            <div key={exam.id} className={`lp-faq-card ${examOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="lp-faq-trigger"
                aria-expanded={examOpen}
                onClick={() => setOpenExam(examOpen ? '' : exam.id)}
              >
                <span className="lp-faq-q">{exam.name} syllabus</span>
                <ChevronDown size={17} className="lp-faq-chevron" />
              </button>
              {examOpen && (
                <div className="lp-faq-body">
                  {exam.stages.map((stage) => {
                    const stageKey = `${exam.id}-${stage.id}`;
                    const stageOpen = openStage === stageKey;
                    return (
                      <div key={stage.id} className="lp-stage-block">
                        <button
                          type="button"
                          className="lp-stage-toggle"
                          aria-expanded={stageOpen}
                          onClick={() => setOpenStage(stageOpen ? '' : stageKey)}
                        >
                          {stage.title}
                          <ChevronDown size={15} />
                        </button>
                        {stageOpen && (
                          <div className="lp-stage-body">
                            {stage.note && <p className="lp-verified-note">{stage.note}</p>}
                            {stage.subjects.map((subject) => (
                              <div key={subject.name} className="lp-subject-block">
                                <h3>{subject.name}</h3>
                                <ul>
                                  {subject.topics.map((topic) => (
                                    <li key={topic}>{topic}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                            <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
                              Practice questions on these topics <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="lp-source-line">
                    Source:{' '}
                    <a href={exam.source.url} target="_blank" rel="noreferrer">
                      {exam.source.label}
                    </a>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TierGuide() {
  return (
    <section id="tiers" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">What Tier-I and Tier-II mean</h2>
        <p className="lp-section-lead">
          A tier is a stage. CGL and CHSL both use tiers, but the papers and marking are not the same.
        </p>
      </div>
      <div className="lp-loop-grid">
        {TIER_CARDS.map((card) => (
          <article key={card.stage} className="lp-loop-card">
            <p className="lp-edc-sub">{card.exam}</p>
            <h3 className="lp-loop-title">{card.stage}</h3>
            <ul className="lp-plain-list">
              {card.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RailwaySection({ onGoToDashboard }: GuideProps) {
  const [open, setOpen] = useState<string>('ntpc');

  return (
    <section id="railway" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">Railway exams</h2>
        <p className="lp-section-lead">
          Railway is not one exam. NTPC, Level-1, ALP, JE and RPF each have a different form, syllabus and
          selection process. Practice here is SSC-first; where subjects overlap, the same questions can support
          Railway CBT preparation.
        </p>
      </div>
      <div className="lp-faq-container">
        {RAILWAY_EXAMS.map((exam) => {
          const isOpen = open === exam.id;
          return (
            <div key={exam.id} className={`lp-faq-card ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="lp-faq-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? '' : exam.id)}
              >
                <span className="lp-faq-q">{exam.name}</span>
                <ChevronDown size={17} className="lp-faq-chevron" />
              </button>
              {isOpen && (
                <div className="lp-faq-body">
                  <p className="lp-faq-a">{exam.process}</p>
                  <ul className="lp-plain-list">
                    {exam.subjects.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="lp-faq-a">{exam.direction}</p>
                  <p className="lp-source-line">
                    Source:{' '}
                    <a href={exam.source.url} target="_blank" rel="noreferrer">
                      {exam.source.label}
                    </a>
                  </p>
                  <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
                    Practice overlapping subjects <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OverlapSection() {
  return (
    <section id="overlap" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">What is common between SSC and Railway prep?</h2>
        <p className="lp-section-lead">
          These are not the same exam. Syllabus weight, marks and selection stages differ. Practising overlapping
          subjects can support both — still read each official notice separately.
        </p>
      </div>
      <div className="lp-loop-grid">
        {COMMON_SUBJECTS.map((item) => (
          <article key={item.name} className="lp-loop-card">
            <h3 className="lp-loop-title">{item.name}</h3>
            <p className="lp-loop-desc">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PrepGuide({ onGoToDashboard }: GuideProps) {
  return (
    <section id="prep-guide" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">A practical prep sequence</h2>
        <p className="lp-section-lead">
          Follow this order. A full mock is more useful after you have completed one round of the syllabus.
        </p>
      </div>
      <ol className="lp-step-grid">
        {PREP_STEPS.map((item) => (
          <li key={item.step} className="lp-loop-card">
            <span className="lp-loop-num">{item.step}</span>
            <h3 className="lp-loop-title">{item.title}</h3>
            <p className="lp-loop-desc">{item.text}</p>
          </li>
        ))}
      </ol>
      <div className="lp-bridge-row">
        <button type="button" className="lp-btn-exam-start" onClick={onGoToDashboard}>
          Topic done? Practise questions <ArrowRight size={14} />
        </button>
        <button type="button" className="lp-btn-sm-ghost" onClick={onGoToDashboard}>
          Check prep — Mock
        </button>
        <button type="button" className="lp-btn-sm-ghost" onClick={onGoToDashboard}>
          Review mistakes — Performance
        </button>
      </div>
    </section>
  );
}

export function PracticePointers({ onGoToDashboard }: GuideProps) {
  return (
    <section id="practice" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">PYQs, mocks and analysis</h2>
        <p className="lp-section-lead">
          After reading the exam info, practise in the app. Nothing below invents a new exam — it only points to
          existing practice, mocks and performance.
        </p>
      </div>
      <div className="lp-loop-grid">
        <article className="lp-loop-card">
          <h3 className="lp-loop-title">Why previous year questions?</h3>
          <p className="lp-loop-desc">
            PYQs show question style, repeated concepts and difficulty. The syllabus comes from the notice;
            PYQs show how that syllabus appeared in the paper.
          </p>
          <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
            Open PYQ / topic practice <ArrowRight size={14} />
          </button>
        </article>
        <article className="lp-loop-card">
          <h3 className="lp-loop-title">Why take a mock?</h3>
          <p className="lp-loop-desc">
            Mocks check speed, accuracy and time use. Weak topics show up when you attempt a full paper in one sitting.
            That is the rehearsal before the real exam.
          </p>
          <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
            Start Mock Test <ArrowRight size={14} />
          </button>
        </article>
        <article className="lp-loop-card">
          <h3 className="lp-loop-title">Score is not enough — analyse</h3>
          <p className="lp-loop-desc">
            After practice or a mock, look at attempts, correct vs incorrect, time, and strong / weak topics.
            Revise the weak topic the next day. A score alone does not show where you got stuck.
          </p>
          <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
            View Performance <ArrowRight size={14} />
          </button>
        </article>
      </div>
    </section>
  );
}
