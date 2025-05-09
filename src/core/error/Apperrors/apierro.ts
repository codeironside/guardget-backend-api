export type ErrorDetailsDescriptor = Array<{
  message: string;
  path: string;
}> | null;

export abstract class ApiError extends Error {
  protected abstract _statusCode: number;
  abstract _message: string;
  abstract _details: ErrorDetailsDescriptor;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  abstract get statusCode(): number;
  abstract override get message(): string;
  abstract get details(): ErrorDetailsDescriptor;
}
