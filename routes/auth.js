import { Router } from 'express';
import auth from '../middleware/auth.js';
import { register, login, changePassword, updateProfile } from '../controllers/authController.js';
import handleValidationErrors from '../middleware/validate.js';
import {
  changePasswordValidation,
  loginValidation,
  registerValidation,
  updateProfileValidation
} from '../validators/auth.js';

const router = Router();
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/change-password', auth, changePasswordValidation, handleValidationErrors, changePassword);
router.put('/profile', auth, updateProfileValidation, handleValidationErrors, updateProfile);

export default router;
