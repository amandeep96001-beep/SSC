import Question from './question.model.js';
import type { IQuestion } from './question.model.js';
import type { Types } from 'mongoose';

class QuestionRepository {
  async findByTopicId(topicId: string) {
    return await Question.find({ topicId }).lean();
  }

  async create(questionData: IQuestion) {
    const question = new Question(questionData);
    return await question.save();
  }

  async insertMany(questionsArray: IQuestion[]) {
    return await Question.insertMany(questionsArray);
  }

  async deleteByIds(ids: Types.ObjectId[] | string[] | undefined) {
    if (!ids?.length) return { deletedCount: 0 };
    return await Question.deleteMany({ _id: { $in: ids } });
  }

  async deleteByTopicId(topicId: string) {
    return await Question.deleteMany({ topicId });
  }

  async deleteByTopicIds(topicIds: string[]) {
    if (!topicIds?.length) return { deletedCount: 0 };
    return await Question.deleteMany({ topicId: { $in: topicIds } });
  }
}

export default new QuestionRepository();
