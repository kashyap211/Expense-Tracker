import { body, param } from 'express-validator';
import { EXPENSE_CATEGORIES, RECURRING_FREQUENCIES } from '../constants/expense.js';

export const createExpenseValidation = [
  body('title')
    .isString().withMessage('Title is required')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer'),
  body('amount')
    .toFloat()
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category')
    .isString().withMessage('Category is required')
    .trim()
    .isIn(EXPENSE_CATEGORIES).withMessage('Category must be one of the supported values'),
  body('type')
    .isString().withMessage('Type is required')
    .trim()
    .isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO-8601 date')
    .toDate(),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be 500 characters or fewer'),
  body('isRecurring')
    .optional()
    .isBoolean().withMessage('isRecurring must be a boolean')
    .toBoolean(),
  body('recurringFrequency')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (value === null || value === undefined || value === '') {
        if (req.body.isRecurring === true) {
          throw new Error('Recurring frequency must be weekly or monthly');
        }

        return true;
      }

      if (!RECURRING_FREQUENCIES.includes(value)) {
        throw new Error('Recurring frequency must be weekly or monthly');
      }

      return true;
    })
];

export const updateExpenseValidation = [
  param('id')
    .isMongoId().withMessage('Expense id must be a valid MongoDB id'),
  body('title')
    .optional()
    .isString().withMessage('Title must be a string')
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer'),
  body('amount')
    .optional()
    .toFloat()
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .trim()
    .isIn(EXPENSE_CATEGORIES).withMessage('Category must be one of the supported values'),
  body('type')
    .optional()
    .isString().withMessage('Type must be a string')
    .trim()
    .isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO-8601 date')
    .toDate(),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be 500 characters or fewer')
];
