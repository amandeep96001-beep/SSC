import examConfigRepository from './exam-config.repository.js';
import type { IExamConfig } from './exam-config.interface.js';
import { EXAM_DEFAULTS } from './exam-defaults.js';
import { notFound } from '../../utils/app-errors.js';

function mergeWithDefaults(docs: Array<Pick<IExamConfig, 'examId' | 'subjects'>>) {
  const byId = Object.fromEntries(docs.map((d) => [d.examId, d.subjects]));
  return Object.keys(EXAM_DEFAULTS).map((examId) => ({
    examId,
    name: EXAM_DEFAULTS[examId].name,
    fullName: EXAM_DEFAULTS[examId].fullName,
    subjects: Object.prototype.hasOwnProperty.call(byId, examId)
      ? byId[examId]
      : EXAM_DEFAULTS[examId].subjects,
  }));
}

export class ExamConfigService {
  async listExamConfigs() {
    const docs = await examConfigRepository.findAll();
    return { data: mergeWithDefaults(docs) };
  }

  async upsertExamConfig(examIdRaw: string, subjectsRaw: unknown) {
    const examId = String(examIdRaw || '').trim();
    if (!EXAM_DEFAULTS[examId]) {
      throw notFound('Unknown exam id.');
    }
    const subjects = Array.isArray(subjectsRaw)
      ? subjectsRaw.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    const doc = await examConfigRepository.upsert(examId, subjects);
    return {
      data: {
        examId: doc!.examId,
        name: EXAM_DEFAULTS[examId].name,
        fullName: EXAM_DEFAULTS[examId].fullName,
        subjects: doc!.subjects,
      },
    };
  }
}

export const examConfigService = new ExamConfigService();
