import Topic from './topic.model.js';
import type { ITopic } from './topic.model.js';

const globalOwnerFilter = {
  $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
};

class TopicRepository {
  async findBySubjectName(subjectName: string, ownerId: string | null = null) {
    const filter = ownerId
      ? { subjectName, ownerId }
      : { subjectName, ...globalOwnerFilter };
    return await Topic.find(filter).lean();
  }

  async findById(id: string) {
    return await Topic.findOne({ id }).lean();
  }

  async create(topicData: ITopic) {
    const newTopic = new Topic(topicData);
    return await newTopic.save();
  }

  async update(id: string, updateData: Partial<ITopic>) {
    return await Topic.findOneAndUpdate({ id }, updateData, { new: true, runValidators: true });
  }

  async deleteById(id: string) {
    return await Topic.findOneAndDelete({ id });
  }

  async deleteBySubjectAndOwner(subjectName: string, ownerId: string | null) {
    if (ownerId == null) {
      return await Topic.deleteMany({
        subjectName,
        $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
      });
    }
    return await Topic.deleteMany({ subjectName, ownerId });
  }

  async findIdsBySubjectAndOwner(subjectName: string, ownerId: string | null) {
    if (ownerId == null) {
      return await Topic.find({
        subjectName,
        $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
      }).select('id').lean();
    }
    return await Topic.find({ subjectName, ownerId }).select('id').lean();
  }

  async insertMany(topics: ITopic[]) {
    return await Topic.insertMany(topics);
  }
}

export default new TopicRepository();
