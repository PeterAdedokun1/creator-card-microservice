'use strict';

class AppError extends Error {
  constructor(message, code, httpStatus) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const throwBusinessError = (message, code, httpStatus = 400) => {
  throw new AppError(message, code, httpStatus);
};

module.exports = { AppError, throwBusinessError };
