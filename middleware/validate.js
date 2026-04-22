import { validationResult } from 'express-validator';

export default (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const [firstError] = errors.array({ onlyFirstError: true });
  return res.status(400).json({
    error: firstError.msg,
    code: 'VALIDATION_ERROR'
  });
};
