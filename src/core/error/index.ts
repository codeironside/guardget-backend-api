import { AppError } from "./Apperrors";

import  HttpStatus  from "@/core/utils/types/common/ApiError/index";
import { ApiError, type ErrorDetailsDescriptor } from "./Apperrors/apierro";
import logger from "../logger";

export class BadRequestError extends ApiError {
  _statusCode = HttpStatus.BAD_REQUEST;
  _message: string;
  _details = null;

  constructor(message: string) {
    super(message);
    this._message = message;
    logger.error(this.message)

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  get statusCode(): number {
    return this._statusCode;
  }

  get message(): string {
    return this._message;
  }

  get details(): ErrorDetailsDescriptor {
    return this._details;
  }
}
