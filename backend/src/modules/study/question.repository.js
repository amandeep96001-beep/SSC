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
}

export default new QuestionRepository();
