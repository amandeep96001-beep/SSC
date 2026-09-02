import ExamConfig from './exam-config.model.js';

function normalizeKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * When a new official subject is created, append it to exam configs (SSC always).
 * Keeps performance tracking and admin order in sync without manual re-setup.
 */
export async function appendSubjectToExamConfigs(subjectName) {
  const name = String(subjectName || '').trim();
  if (!name) return;

  const key = normalizeKey(name);
  const configured = await ExamConfig.find({ subjects: { $exists: true, $not: { $size: 0 } } })
    .select('examId subjects')
    .lean();

  const examIds = new Set(configured.map((row) => row.examId));
  examIds.add('ssc');

  await Promise.all(
    [...examIds].map(async (examId) => {
      const doc = await ExamConfig.findOne({ examId }).lean();
      const current = Array.isArray(doc?.subjects) ? doc.subjects : [];
      if (current.some((s) => normalizeKey(s) === key)) return;

      await ExamConfig.findOneAndUpdate(
        { examId },
        { $set: { subjects: [...current, name] } },
        { upsert: true, new: true }
      );
    })
  );
}
