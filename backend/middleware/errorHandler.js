// Centralized error handling middleware

function errorHandler(err, req, res, next) {
  // Default status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = undefined;

  // Common known error shapes
  switch (err.name) {
    case 'ValidationError': {
      statusCode = 400;
      errors = Object.values(err.errors || {}).map((e) => e.message);
      message = 'Validation failed';
      break;
    }
    case 'CastError': {
      statusCode = 400;
      message = `Invalid ${err.path || 'parameter'}: ${err.value}`;
      break;
    }
    case 'JsonWebTokenError': {
      statusCode = 401;
      message = 'Invalid token';
      break;
    }
    case 'TokenExpiredError': {
      statusCode = 401;
      message = 'Token expired';
      break;
    }
    default:
      break;
  }

  // Handle Mongo duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value for field${fields.length > 1 ? 's' : ''}: ${fields.join(', ')}`;
  }

  // Log server-side (avoid leaking in response)
  // Prefer concise logs in production
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`);
  } else {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload = {
    status: 'error',
    message,
  };

  if (errors && errors.length) {
    payload.errors = errors;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;


