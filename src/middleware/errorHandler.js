'use strict';

const { AppError } = require('../lib/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json({
      status: 'error',
      message: err.message,
      code: err.code,
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON in request body',
    });
  }

  console.error(err);

  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
