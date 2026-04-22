import { body } from 'express-validator';

export const registerValidation = [
  body('name')
    .isString().withMessage('Name is required')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer'),
  body('email')
    .isEmail().withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

export const loginValidation = [
  body('email')
    .isEmail().withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password is required')
    .notEmpty().withMessage('Password is required')
];

export const changePasswordValidation = [
  body('currentPassword')
    .isString().withMessage('Current password is required')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

export const updateProfileValidation = [
  body('name')
    .isString().withMessage('Name is required')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer')
];
