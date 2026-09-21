import type { Model } from 'mongoose';

export class BaseRepository<T> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async findAll() {
    return this.model.find().lean();
  }

  async findById(id: string) {
    return this.model.findById(id).lean();
  }

  async updateById(id: string, data: Partial<T>) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
