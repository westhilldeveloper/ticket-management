export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export const handleAsyncError = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = { ...err }
  error.message = err.message

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered'
    error = new AppError(message, 400)
  }

  if (err.code === 'P2025') {
    const message = 'Record not found'
    error = new AppError(message, 404)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = new AppError(message, 401)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = new AppError(message, 401)
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}