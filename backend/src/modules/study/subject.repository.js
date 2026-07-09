import Subject from './subject.model.js';

class SubjectRepository {
  async findAll(fields = null) {
    const query = Subject.find({});
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findByName(name, lean = false) {
    const query = Subject.findOne({ name });
    return lean ? await query.lean() : await query;
  }


  async save(subject) {
    return await subject.save();
  }
}

export default new SubjectRepository();
