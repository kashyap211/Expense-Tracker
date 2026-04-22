import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { createHttpError, handleControllerError } from '../utils/http.js';

const sign = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email },
  config.jwtSecret,
  { expiresIn: '7d' }
);

const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      throw createHttpError(400, 'AUTH_FIELDS_REQUIRED', 'All fields required');
    }

    if (password.length < 8) {
      throw createHttpError(400, 'PASSWORD_TOO_SHORT', 'Password must be at least 8 characters');
    }

    if (await User.findOne({ email: normalizedEmail })) {
      throw createHttpError(400, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10)
    });

    res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error?.code === 11000) {
      return handleControllerError(res, createHttpError(400, 'EMAIL_ALREADY_REGISTERED', 'Email already registered'));
    }

    return handleControllerError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw createHttpError(400, 'LOGIN_FIELDS_REQUIRED', 'Email and password are required');
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw createHttpError(400, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createHttpError(400, 'PASSWORD_FIELDS_REQUIRED', 'Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw createHttpError(400, 'PASSWORD_TOO_SHORT', 'Password must be at least 8 characters');
    }

    const user = await User.findById(req.user.id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw createHttpError(400, 'CURRENT_PASSWORD_INVALID', 'Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      throw createHttpError(400, 'NAME_REQUIRED', 'Name is required');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw createHttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      token: sign(user),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};
