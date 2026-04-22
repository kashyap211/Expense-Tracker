import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES, RECURRING_FREQUENCIES } from '../constants/expense.js';

export default mongoose.model('Expense', new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  amount:      { type: Number, required: true },
  category:    { type: String, enum: EXPENSE_CATEGORIES, required: true },
  type:        { type: String, enum: ['expense', 'income'], required: true },
  date:        { type: Date, default: Date.now },
  description: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: {
    type: String,
    enum: RECURRING_FREQUENCIES,
    default: null
  },
  createdAt:   { type: Date, default: Date.now }
}));
