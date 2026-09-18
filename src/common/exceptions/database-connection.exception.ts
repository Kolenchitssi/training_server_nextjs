import { HttpException, HttpStatus } from '@nestjs/common';

/**
  Custom exception for database connection failures
 */
export class DatabaseConnectionException extends HttpException {
  constructor(message?: string, originalError?: Error) {
    const errorMessage = message || 'Unable to connect to the database';
    const errorResponse = {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: errorMessage,
      error: 'Database Connection Error',
      timestamp: new Date().toISOString(),
    };

    // Log the original error for debugging (don't expose to client)
    if (originalError) {
      console.error('Database connection error details:', originalError);
    }

    super(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
