import { useEffect, useState } from 'react';
import { Plus, Save, Shield, X } from 'lucide-react';
import { useExam } from '@/shared/context/useExam';
import { EXAM_LIST } from '@/shared/examProfiles';
import { apiService } from '@/shared/services/apiService';

export function AdminWorkspace() {
  const { subjectsByExam, saveExamSubjects, refreshExamConfigs } = useExam();
  const [examId, setExamId] = useState('ssc');
  const [subjects, setSubjects] = useState([]);
  const [draft, setDraft] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    refreshExamConfigs();
    (async () => {
      try {
        const res = await apiService.get('/study/subjects?source=global');
        const list = res?.data || [];
        const names = (Array.isArray(list) ? list : []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
        setAllSubjects(names);
      } catch {
        setAllSubjects([]);
      }
    })();
  }, [refreshExamConfigs]);

  useEffect(() => {
    setSubjects([...(subjectsByExam[examId] || [])]);
    setMsg('');
    setErr('');
  }, [examId, subjectsByExam]);

  const selected = EXAM_LIST.find((e) => e.id === examId);

  const addSubject = (name) => {
    const n = String(name || draft).trim();
    if (!n) return;
    if (subjects.some((s) => s.toLowerCase() === n.toLowerCase())) {
      setDraft('');
      return;
    }
    setSubjects((prev) => [...prev, n]);
    setDraft('');
  };

  const removeSubject = (name) => {
    setSubjects((prev) => prev.filter((s) => s !== name));
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    const res = await saveExamSubjects(examId, subjects);
    setSaving(false);
    if (res.success) setMsg('Saved. Students will see this subject list on What to study.');
    else setErr(res.message || 'Save failed');
  };

  return (
    <div className="admin-workspace">
      <header className="admin-workspace__head">
        <p className="today-focus__eyebrow"><Shield size={14} /> Admin</p>
        <h1>Exam subjects</h1>
        <p>Map subjects to each exam. Students open a subject to view the syllabus.</p>
      </header>

      <div className="admin-exam-tabs">
        {EXAM_LIST.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`admin-exam-tab${examId === e.id ? ' is-active' : ''}`}
            style={{ '--exam-accent': e.accent }}
            onClick={() => setExamId(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <section className="admin-panel">
        <h2>{selected?.fullName || examId}</h2>
        <p className="admin-panel__hint">This list appears on the student What to study screen.</p>

        <div className="admin-subject-chips">
          {subjects.map((s) => (
            <span key={s} className="admin-chip">
              {s}
              <button type="button" onClick={() => removeSubject(s)} aria-label={`Remove ${s}`}>
                <X size={14} />
              </button>
            </span>
          ))}
          {subjects.length === 0 && <p className="study-empty">No subjects yet. Add subjects below.</p>}
        </div>

        <div className="admin-add-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Subject name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject();
              }
            }}
          />
          <button type="button" className="admin-btn" onClick={() => addSubject()}>
            <Plus size={16} /> Add
          </button>
        </div>

        {allSubjects.length > 0 && (
          <div className="admin-suggest">
            <p>Quick add from official syllabus:</p>
            <div className="admin-suggest__list">
              {allSubjects.map((name) => {
                const on = subjects.some((s) => s.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    className={`admin-suggest-btn${on ? ' is-on' : ''}`}
                    disabled={on}
                    onClick={() => addSubject(name)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button type="button" className="admin-save" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save for students'}
        </button>
        {msg && <p className="admin-ok">{msg}</p>}
        {err && <p className="admin-err">{err}</p>}
      </section>
    </div>
  );
}
