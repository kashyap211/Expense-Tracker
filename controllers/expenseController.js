import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import { RECURRING_FREQUENCIES } from '../constants/expense.js';
import { createHttpError, handleControllerError } from '../utils/http.js';

const EXPENSE_UPDATE_FIELDS = ['title', 'amount', 'category', 'type', 'date', 'description'];

const getPeriodDateRange = (month, year) => {
  const parsedMonth = month ? parseInt(month, 10) : null;
  const parsedYear = year ? parseInt(year, 10) : null;
  const now = new Date();

  if (parsedMonth && parsedYear) {
    return { $gte: new Date(parsedYear, parsedMonth - 1, 1), $lt: new Date(parsedYear, parsedMonth, 1) };
  }

  if (parsedYear) {
    return { $gte: new Date(parsedYear, 0, 1), $lt: new Date(parsedYear + 1, 0, 1) };
  }

  if (parsedMonth) {
    const currentYear = now.getFullYear();
    return { $gte: new Date(currentYear, parsedMonth - 1, 1), $lt: new Date(currentYear, parsedMonth, 1) };
  }

  return null;
};

export const getAll = async (req, res) => {
  try {
    const { month, year, category, type } = req.query;
    const filter = { userId: req.user.id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
    }

    res.json(await Expense.find(filter).sort({ date: -1 }));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const create = async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      type,
      date,
      description,
      isRecurring = false,
      recurringFrequency = null
    } = req.body;

    if (!title || !amount || !category || !type) {
      throw createHttpError(400, 'EXPENSE_FIELDS_REQUIRED', 'Required fields missing');
    }

    if (isRecurring && !RECURRING_FREQUENCIES.includes(recurringFrequency)) {
      throw createHttpError(400, 'INVALID_RECURRING_FREQUENCY', 'Recurring frequency must be weekly or monthly');
    }

    res.json(await Expense.create({
      userId: req.user.id,
      title,
      amount,
      category,
      type,
      date: date || Date.now(),
      description,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null
    }));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const update = async (req, res) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => EXPENSE_UPDATE_FIELDS.includes(field))
    );

    if (!Object.keys(updates).length) {
      throw createHttpError(400, 'INVALID_EXPENSE_UPDATE', 'No valid fields provided for update');
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!expense) {
      throw createHttpError(404, 'EXPENSE_NOT_FOUND', 'Expense not found');
    }

    res.json(expense);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const remove = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      throw createHttpError(404, 'EXPENSE_NOT_FOUND', 'Expense not found');
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const summary = async (req, res) => {
  try {
    const now = new Date();
    const y = parseInt(req.query.year, 10) || now.getFullYear();
    const comparisonMonth = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const comparisonRange = {
      $gte: new Date(y, comparisonMonth - 1, 1),
      $lt: new Date(y, comparisonMonth, 1)
    };
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [monthlyTotals, budgets, spendingByCategory] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId,
            date: { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }
          }
        },
        { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } }
      ]),
      Budget.find({ userId: req.user.id, month: comparisonMonth, year: y }).lean(),
      Expense.aggregate([
        {
          $match: {
            userId,
            type: 'expense',
            date: comparisonRange
          }
        },
        { $group: { _id: '$category', spent: { $sum: '$amount' } } }
      ])
    ]);

    const budgetMap = new Map(budgets.map((budget) => [budget.category, budget.amount]));
    const spentMap = new Map(spendingByCategory.map((item) => [item._id, item.spent]));
    const categories = new Set([...budgetMap.keys(), ...spentMap.keys()]);

    const budgetComparison = [...categories].sort().map((category) => {
      const budget = budgetMap.get(category) || 0;
      const spent = spentMap.get(category) || 0;
      const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      return {
        category,
        budget,
        spent,
        remaining: budget - spent,
        percentUsed
      };
    });

    res.json({
      monthlyTotals,
      budgetComparison,
      period: { month: comparisonMonth, year: y }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const exportExpenses = async (req, res) => {
  try {
    const { month, year, type } = req.query;
    const filter = { userId: req.user.id };
    const dateRange = getPeriodDateRange(month, year);

    if (type) filter.type = type;
    if (dateRange) filter.date = dateRange;

    const expenses = await Expense.find(filter).sort({ date: -1 }).lean();
    const parser = new Parser({
      fields: [
        '_id',
        'title',
        'amount',
        'category',
        'type',
        'date',
        'description',
        'isRecurring',
        'recurringFrequency',
        'createdAt'
      ]
    });
    const csv = parser.parse(expenses);
    const filenameParts = ['expenses'];

    if (year) filenameParts.push(year);
    if (month) filenameParts.push(String(month).padStart(2, '0'));
    if (type) filenameParts.push(type);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameParts.join('-')}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    return handleControllerError(res, error);
  }
};
