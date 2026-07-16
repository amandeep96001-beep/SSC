import { Check, X } from 'lucide-react';
import { EXAM_LIST } from '@/shared/examProfiles';
import { useExam } from '@/shared/context/useExam';
import { ExamDatePicker } from '@/shared/components/ui/ExamDatePicker';
import '@/shared/components/ui/exam-date-picker.css';

export function ExamPicker({ force = false }) {
  const { examId, exam, examDate, setExamId, setExamDate, pickerOpen, closeExamPicker, onboarded } = useExam();

  const open = force || pickerOpen || !onboarded;
  if (!open) return null;

  return (
    <div className="exam-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="exam-picker-title">
      <div className="exam-picker-card">
        <div className="exam-picker-card__head">
          <div>
            <h2 id="exam-picker-title">Choose your target exam</h2>
            <p>Select an exam and optional date. Subject lists are managed by your admin.</p>
          </div>
          {onboarded && (
            <button type="button" className="exam-picker-close" onClick={closeExamPicker} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="exam-picker-grid">
          {EXAM_LIST.map((item) => {
            const selected = examId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`exam-picker-option${selected ? ' is-selected' : ''}`}
                style={{ '--exam-accent': item.accent }}
                onClick={() => setExamId(item.id)}
              >
                <span className="exam-picker-option__name">{item.name}</span>
                <span className="exam-picker-option__full">{item.fullName}</span>
                <span className="exam-picker-option__tag">{item.tagline}</span>
                {selected && (
                  <span className="exam-picker-option__check" aria-hidden>
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="exam-picker-calendar">
          <ExamDatePicker
            value={examDate}
            onChange={setExamDate}
            accent={exam.accent}
            examName={exam.name}
          />
        </div>

        <button type="button" className="exam-picker-done" onClick={closeExamPicker}>
          {onboarded ? 'Continue' : `Start preparing — ${exam.name}`}
        </button>
      </div>
    </div>
  );
}
