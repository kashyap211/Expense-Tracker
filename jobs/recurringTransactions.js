import cron from 'node-cron';
import Expense from '../models/Expense.js';
import { RECURRING_FREQUENCIES } from '../constants/expense.js';

let jobStarted = false;

const getNextOccurrenceDate = (date, frequency) => {
  const nextDate = new Date(date);

  if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate;
  }

  if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  return null;
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const hasMatchingOccurrence = async (expense, date) => {
  const range = getDayRange(date);

  return Expense.exists({
    userId: expense.userId,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    type: expense.type,
    description: expense.description || '',
    isRecurring: true,
    recurringFrequency: expense.recurringFrequency,
    date: { $gte: range.start, $lt: range.end }
  });
};

export const generateRecurringTransactions = async () => {
  const recurringExpenses = await Expense.find({
    isRecurring: true,
    recurringFrequency: { $in: RECURRING_FREQUENCIES }
  }).lean();

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (const expense of recurringExpenses) {
    let nextDate = getNextOccurrenceDate(expense.date, expense.recurringFrequency);

    while (nextDate && nextDate <= today) {
      const exists = await hasMatchingOccurrence(expense, nextDate);

      if (!exists) {
        await Expense.create({
          userId: expense.userId,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          type: expense.type,
          date: nextDate,
          description: expense.description || '',
          isRecurring: true,
          recurringFrequency: expense.recurringFrequency
        });
      }

      nextDate = getNextOccurrenceDate(nextDate, expense.recurringFrequency);
    }
  }
};

export const startRecurringExpenseJob = async () => {
  if (jobStarted) return;

  jobStarted = true;
  await generateRecurringTransactions();

  cron.schedule('0 0 * * *', async () => {
    try {
      await generateRecurringTransactions();
    } catch (err) {
      console.error('❌ Recurring transaction job failed:', err);
    }
  });
};
