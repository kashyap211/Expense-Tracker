import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export default (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid token',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};
