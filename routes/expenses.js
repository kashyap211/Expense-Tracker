import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getAll, create, update, remove, summary, exportExpenses } from '../controllers/expenseController.js';
import handleValidationErrors from '../middleware/validate.js';
import { createExpenseValidation, updateExpenseValidation } from '../validators/expense.js';

const router = Router();
router.get('/summary', auth, summary);
router.get('/export', auth, exportExpenses);
router.get('/', auth, getAll);
router.post('/', auth, createExpenseValidation, handleValidationErrors, create);
router.put('/:id', auth, updateExpenseValidation, handleValidationErrors, update);
router.delete('/:id', auth, remove);

export default router;
