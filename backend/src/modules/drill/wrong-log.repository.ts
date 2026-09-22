import WrongLog from './wrong-log.model.js';
import type { WrongLogUpsertInput } from './wrong-log.interface.js';

const MAX_LOG = Number(process.env.WRONG_LOG_LIMIT || 50);

function sanitize(input: WrongLogUpsertInput) {
  return {
    question: String(input.question || '').trim().slice(0, 2000),
    correctAnswer:
      input.correctAnswer != null ? String(input.correctAnswer).slice(0, 500) : undefined,
    userAnswer: input.userAnswer != null ? String(input.userAnswer).slice(0, 500) : undefined,
    options: Array.isArray(input.options) ? input.options.slice(0, 8).map(String) : undefined,
    placeholder: input.placeholder != null ? String(input.placeholder).slice(0, 200) : undefined,
    explanation: input.explanation != null ? String(input.explanation).slice(0, 4000) : undefined,
    category: input.category != null ? String(input.category).slice(0, 120) : undefined,
    type: input.type ? String(input.type).slice(0, 40) : undefined,
    word: input.word != null ? String(input.word).slice(0, 200) : undefined,
    revealDefinition:
      input.revealDefinition != null ? String(input.revealDefinition).slice(0, 2000) : undefined,
    revealSynonyms: Array.isArray(input.revealSynonyms)
      ? input.revealSynonyms.slice(0, 12).map(String)
      : undefined,
    revealAntonyms: Array.isArray(input.revealAntonyms)
      ? input.revealAntonyms.slice(0, 12).map(String)
      : undefined,
    pos: input.pos != null ? String(input.pos).slice(0, 80) : undefined,
  };
}

class WrongLogRepository {
  async listByUser(userId: string, limit = MAX_LOG) {
    const capped = Math.min(Math.max(1, limit), 100);
    return WrongLog.find({ userId })
      .sort({ lastWrongAt: -1 })
      .limit(capped)
      .lean();
  }

  async upsertWrong(userId: string, input: WrongLogUpsertInput) {
    const data = sanitize(input);
    if (!data.question) return null;

    const now = new Date();
    const existing = await WrongLog.findOne({ userId, question: data.question });
    let doc;
    if (existing) {
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.lastWrongAt = now;
      if (data.correctAnswer !== undefined) existing.correctAnswer = data.correctAnswer;
      if (data.userAnswer !== undefined) existing.userAnswer = data.userAnswer;
      await existing.save();
      doc = existing.toObject();
    } else {
      doc = (await WrongLog.create({
        userId,
        ...data,
        wrongCount: 1,
        lastWrongAt: now,
      })).toObject();
    }

    const overflow = await WrongLog.find({ userId })
      .sort({ lastWrongAt: -1 })
      .skip(MAX_LOG)
      .select('_id')
      .lean();
    if (overflow.length) {
      await WrongLog.deleteMany({ _id: { $in: overflow.map((r) => r._id) } });
    }

    return doc;
  }

  async deleteOne(userId: string, id: string) {
    return WrongLog.deleteOne({ _id: id, userId });
  }

  async deleteByQuestion(userId: string, question: string) {
    return WrongLog.deleteOne({ userId, question: String(question).trim() });
  }

  async clearAll(userId: string, type?: string) {
    const filter: { userId: string; type?: string } = { userId };
    if (type) filter.type = type;
    return WrongLog.deleteMany(filter);
  }

  async bulkInsert(userId: string, rows: WrongLogUpsertInput[]) {
    let count = 0;
    for (const row of rows.slice(0, MAX_LOG)) {
      const doc = await this.upsertWrong(userId, row);
      if (doc) count += 1;
    }
    return count;
  }
}

export default new WrongLogRepository();
