import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../constants/expense.js';

const budgetSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
  amount:   { type: Number, required: true, min: 0 },
  month:    { type: Number, required: true, min: 1, max: 12 },
  year:     { type: Number, required: true, min: 2000 }
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
