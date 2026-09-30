import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ_LIST } from '../data/landingData';

export function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIdx((cur) => (cur === i ? null : i));
  };

  return (
    <section id="faq" className="lp-section lp-faq-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">
          Frequently Asked Questions
        </h2>
        <p className="lp-section-lead">
          Common questions on exams, syllabus, mocks and the platform.
        </p>
      </div>

      <div className="lp-faq-container">
        {FAQ_LIST.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`lp-faq-card ${isOpen ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className="lp-faq-trigger"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
              >
                <span className="lp-faq-q">{item.question}</span>
                <span className="lp-faq-chevron">
                  <ChevronDown size={17} />
                </span>
              </button>

              {isOpen && (
                <div className="lp-faq-body">
                  <p className="lp-faq-a">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
