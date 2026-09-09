import type { RequestHandler } from 'express';
import ExamConfig from './exam-config.model.js';
import type { IExamConfig } from './exam-config.model.js';
import { EXAM_DEFAULTS } from './exam-defaults.js';

function mergeWithDefaults(docs: Array<Pick<IExamConfig, 'examId' | 'subjects'>>) {
  const byId = Object.fromEntries(docs.map((d) => [d.examId, d.subjects]));
  return Object.keys(EXAM_DEFAULTS).map((examId) => ({
    examId,
    name: EXAM_DEFAULTS[examId].name,
    fullName: EXAM_DEFAULTS[examId].fullName,
    // Empty array is a valid admin override (e.g. Railway/Bank until subjects are added)
    subjects: Object.prototype.hasOwnProperty.call(byId, examId)
      ? byId[examId]
      : EXAM_DEFAULTS[examId].subjects,
  }));
}

export const listExamConfigs: RequestHandler = async (req, res, next) => {
  try {
    const docs = await ExamConfig.find({}).lean();
    res.json({ status: 'success', data: mergeWithDefaults(docs) });
  } catch (err) {
    next(err);
  }
};

export const upsertExamConfig: RequestHandler = async (req, res, next) => {
  try {
    const examId = String(req.params.examId || '').trim();
    if (!EXAM_DEFAULTS[examId]) {
      return res.status(404).json({ status: 'error', message: 'Unknown exam id.' });
    }
    const subjects = Array.isArray(req.body.subjects)
      ? req.body.subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    const doc = await ExamConfig.findOneAndUpdate(
      { examId },
      { examId, subjects },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      status: 'success',
      data: {
        examId: doc!.examId,
        name: EXAM_DEFAULTS[examId].name,
        fullName: EXAM_DEFAULTS[examId].fullName,
        subjects: doc!.subjects,
      },
    });
  } catch (err) {
    next(err);
  }
};
