import { HttpException, HttpStatus } from '@nestjs/common';

export class TypeImageException extends HttpException {
  constructor(message?: string) {
    super(
      message || 'Only image/jpeg and image/png files are allowed',
      HttpStatus.BAD_REQUEST,
    );
  }
}
