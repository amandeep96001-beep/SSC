import Subject from './subject.model.js';
import type { ISubject } from './subject.model.js';
import { normalizeSubjectKey } from './subject-names.js';
import type { HydratedDocument } from 'mongoose';

const globalOwnerFilter = {
  $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
};

class SubjectRepository {
  async findAll(fields: string | null = null) {
    const query = Subject.find({});
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findGlobal(fields: string | null = null) {
    const query = Subject.find(globalOwnerFilter);
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findByOwner(ownerId: string, fields: string | null = null) {
    const query = Subject.find({ ownerId });
    if (fields) query.select(fields);
    return await query.lean();
  }

  async findByName(name: string, lean = false, ownerId: string | null = null) {
    const filter = ownerId
      ? { name, ownerId }
      : { name, ...globalOwnerFilter };
    const query = Subject.findOne(filter);
    return lean ? await query.lean() : await query;
  }

  /** Exact name first, then normalized match (spacing / hyphen tolerant). */
  async resolveByName(name: string, ownerId: string | null = null) {
    const exact = await this.findByName(name, true, ownerId);
    if (exact) return exact;

    const filter = ownerId ? { ownerId } : globalOwnerFilter;
    const candidates = await Subject.find(filter).select('name ownerId').lean();
    const want = normalizeSubjectKey(name);
    return candidates.find((s) => normalizeSubjectKey(s.name) === want) || null;
  }

  async create(data: ISubject) {
    const subject = new Subject(data);
    return await subject.save();
  }

  async deleteByNameAndOwner(name: string, ownerId: string) {
    return await Subject.findOneAndDelete({ name, ownerId });
  }

  async deleteGlobalByName(name: string) {
    return await Subject.findOneAndDelete({ name, ...globalOwnerFilter });
  }

  async save(subject: HydratedDocument<ISubject>) {
    return await subject.save();
  }
}

export default new SubjectRepository();
