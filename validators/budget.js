import { body } from 'express-validator';
import { EXPENSE_CATEGORIES } from '../constants/expense.js';

export const upsertBudgetValidation = [
  body('category')
    .isString().withMessage('Category is required')
    .trim()
    .isIn(EXPENSE_CATEGORIES).withMessage('Category must be one of the supported values'),
  body('amount')
    .toFloat()
    .isFloat({ min: 0 }).withMessage('Budget amount must be 0 or greater'),
  body('month')
    .toInt()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year')
    .toInt()
    .isInt({ min: 2000, max: 3000 }).withMessage('Year must be a valid four-digit year')
];
