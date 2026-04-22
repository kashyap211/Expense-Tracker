import Budget from '../models/Budget.js';
import { createHttpError, handleControllerError } from '../utils/http.js';

const getPeriod = (month, year) => {
  const now = new Date();
  return {
    month: parseInt(month, 10) || now.getMonth() + 1,
    year: parseInt(year, 10) || now.getFullYear()
  };
};

export const upsertBudget = async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;
    const period = getPeriod(month, year);

    if (!category || amount === undefined || amount === null || !period.month || !period.year) {
      throw createHttpError(400, 'BUDGET_FIELDS_REQUIRED', 'Category, amount, month, and year are required');
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user.id, category, month: period.month, year: period.year },
      { category, amount, month: period.month, year: period.year },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(budget);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const getBudgets = async (req, res) => {
  try {
    const period = getPeriod(req.query.month, req.query.year);
    const budgets = await Budget.find({
      userId: req.user.id,
      month: period.month,
      year: period.year
    }).sort({ category: 1 });

    res.json({ month: period.month, year: period.year, budgets });
  } catch (error) {
    return handleControllerError(res, error);
  }
};
