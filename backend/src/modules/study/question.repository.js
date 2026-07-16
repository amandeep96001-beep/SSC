import Question from './question.model.js';

class QuestionRepository {
  async findByTopicId(topicId) {
    return await Question.find({ topicId }).lean();
  }

  async create(questionData) {
    const question = new Question(questionData);
    return await question.save();
  }

  async insertMany(questionsArray) {
    return await Question.insertMany(questionsArray);
  }

  async deleteByTopicId(topicId) {
    return await Question.deleteMany({ topicId });
  }

  async deleteByTopicIds(topicIds) {
    if (!topicIds?.length) return { deletedCount: 0 };
    return await Question.deleteMany({ topicId: { $in: topicIds } });
  }
}

export default new QuestionRepository();
