import Subject from './subject.model.js';

const globalOwnerFilter = {
  $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
};

class SubjectRepository {
  async findAll(fields = null) {
    const query = Subject.find({});
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findGlobal(fields = null) {
    const query = Subject.find(globalOwnerFilter);
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findByOwner(ownerId, fields = null) {
    const query = Subject.find({ ownerId });
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findByName(name, lean = false, ownerId = null) {
    const filter = ownerId
      ? { name, ownerId }
      : { name, ...globalOwnerFilter };
    const query = Subject.findOne(filter);
    return lean ? await query.lean() : await query;
  }

  async create(data) {
    const subject = new Subject(data);
    return await subject.save();
  }

  async deleteByNameAndOwner(name, ownerId) {
    return await Subject.findOneAndDelete({ name, ownerId });
  }

  async save(subject) {
    return await subject.save();
  }
}

export default new SubjectRepository();
