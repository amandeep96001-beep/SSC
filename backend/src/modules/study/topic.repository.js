import Topic from './topic.model.js';

const globalOwnerFilter = {
  $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
};

class TopicRepository {
  async findBySubjectName(subjectName, ownerId = null) {
    const filter = ownerId
      ? { subjectName, ownerId }
      : { subjectName, ...globalOwnerFilter };
    return await Topic.find(filter).lean();
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

  async deleteBySubjectAndOwner(subjectName, ownerId) {
    if (ownerId == null) {
      return await Topic.deleteMany({
        subjectName,
        $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
      });
    }
    return await Topic.deleteMany({ subjectName, ownerId });
  }

  async findIdsBySubjectAndOwner(subjectName, ownerId) {
    if (ownerId == null) {
      return await Topic.find({
        subjectName,
        $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
      }).select('id').lean();
    }
    return await Topic.find({ subjectName, ownerId }).select('id').lean();
  }

  async insertMany(topics) {
    return await Topic.insertMany(topics);
  }
}

export default new TopicRepository();
