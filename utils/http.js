export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const createHttpError = (status, code, message) => new HttpError(status, code, message);

export const formatError = (error) => {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code
      }
    };
  }

  console.error(error);

  return {
    status: 500,
    body: {
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  };
};

export const handleControllerError = (res, error) => {
  const { status, body } = formatError(error);
  return res.status(status).json(body);
};
