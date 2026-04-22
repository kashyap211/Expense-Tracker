import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getBudgets, upsertBudget } from '../controllers/budgetController.js';
import handleValidationErrors from '../middleware/validate.js';
import { upsertBudgetValidation } from '../validators/budget.js';

const router = Router();

router.get('/', auth, getBudgets);
router.post('/', auth, upsertBudgetValidation, handleValidationErrors, upsertBudget);

export default router;
