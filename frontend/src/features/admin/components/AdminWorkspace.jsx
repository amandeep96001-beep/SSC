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
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadAllSubjects = async () => {
    try {
      const res = await apiService.get('/study/subjects?source=global');
      const list = res?.data || [];
      const names = (Array.isArray(list) ? list : [])
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter(Boolean);
      setAllSubjects(names);
    } catch {
      setAllSubjects([]);
    }
  };

  useEffect(() => {
    refreshExamConfigs();
    loadAllSubjects();
  }, [refreshExamConfigs]);

  useEffect(() => {
    setSubjects([...(subjectsByExam[examId] || [])]);
    setMsg('');
    setErr('');
  }, [examId, subjectsByExam]);

  const selected = EXAM_LIST.find((e) => e.id === examId);

  const ensureOfficialSubject = async (name) => {
    const exists = allSubjects.some((s) => s.toLowerCase() === name.toLowerCase());
    if (exists) return { ok: true };
    try {
      const res = await apiService.post('/study/subjects', { name, scope: 'global' });
      if (res?.status === 'success') {
        setAllSubjects((prev) => (prev.some((s) => s.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
        return { ok: true, created: !res?.data?.alreadyExisted };
      }
      return { ok: false, message: res?.message || 'Could not create subject.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Could not create subject.' };
    }
  };

  const addSubject = async (name) => {
    const n = String(name || draft).trim();
    if (!n || adding) return;
    if (subjects.some((s) => s.toLowerCase() === n.toLowerCase())) {
      setDraft('');
      return;
    }

    setAdding(true);
    setErr('');
    const ensured = await ensureOfficialSubject(n);
    setAdding(false);
    if (!ensured.ok) {
      setErr(ensured.message || 'Failed to add subject.');
      return;
    }

    setSubjects((prev) => [...prev, n]);
    setDraft('');
    setMsg(
      ensured.created
        ? `Created “${n}” and added to ${selected?.name || examId}. Save to publish for students.`
        : `Added “${n}” to ${selected?.name || examId}. Save to publish for students.`
    );
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
    if (res.success) {
      setMsg(`Saved for ${selected?.name || examId}. Students targeting this exam will see this subject list.`);
    } else {
      setErr(res.message || 'Save failed');
    }
  };

  return (
    <div className="admin-workspace">
      <header className="admin-workspace__head">
        <p className="today-focus__eyebrow"><Shield size={14} /> Admin</p>
        <h1>Exam subjects</h1>
        <p>
          Existing syllabus subjects belong to SSC. Choose another exam (Banking, Railways, …),
          then add subjects for that exam and save.
        </p>
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
        <p className="admin-panel__hint">
          Students who pick <strong>{selected?.name || examId}</strong> see only these subjects on
          What to study and Official Syllabus.
        </p>

        <div className="admin-subject-chips">
          {subjects.map((s) => (
            <span key={s} className="admin-chip">
              {s}
              <button type="button" onClick={() => removeSubject(s)} aria-label={`Remove ${s}`}>
                <X size={14} />
              </button>
            </span>
          ))}
          {subjects.length === 0 && (
            <p className="study-empty">
              No subjects for this exam yet. Add from the official list below, or type a new name.
            </p>
          )}
        </div>

        <div className="admin-add-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`New subject for ${selected?.name || 'this exam'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject();
              }
            }}
          />
          <button type="button" className="admin-btn" onClick={() => addSubject()} disabled={adding}>
            <Plus size={16} /> {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        {allSubjects.length > 0 && (
          <div className="admin-suggest">
            <p>Quick add from official syllabus (shared notes &amp; topics):</p>
            <div className="admin-suggest__list">
              {allSubjects.map((name) => {
                const on = subjects.some((s) => s.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    className={`admin-suggest-btn${on ? ' is-on' : ''}`}
                    disabled={on || adding}
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
          <Save size={16} /> {saving ? 'Saving…' : `Save for ${selected?.name || 'exam'}`}
        </button>
        {msg && <p className="admin-ok">{msg}</p>}
        {err && <p className="admin-err">{err}</p>}
      </section>
    </div>
  );
}
