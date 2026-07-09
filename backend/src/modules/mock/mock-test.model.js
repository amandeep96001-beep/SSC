import mongoose from 'mongoose';

const MockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, default: '' },
  date: { type: String, default: '' },
  shift: { type: String, default: '' },
  questions: [{
    section: { 
      type: String, 
      enum: ['English', 'GK', 'Quant', 'Reasoning'],
      required: true 
    },
    q: { type: String, required: true },
    o: [{ type: String, required: true }],
    a: { type: Number, required: true },
    e: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const MockTest = mongoose.model('MockTest', MockTestSchema);

export default MockTest;
