import Topic from './topic.model.js';

class TopicRepository {
  async findBySubjectName(subjectName) {
    return await Topic.find({ subjectName }).lean();
  }

  async findById(id) {
    return await Topic.findOne({ id }).lean();
  }

  async create(topicData) {
    const newTopic = new Topic(topicData);
    return await newTopic.save();
  }

  async update(id, updateData) {
    return await Topic.findOneAndUpdate({ id }, updateData, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return await Topic.findOneAndDelete({ id });
  }

  async insertMany(topics) {
    return await Topic.insertMany(topics);
  }
}

export default new TopicRepository();
