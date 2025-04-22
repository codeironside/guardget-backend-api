export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational: boolean = true) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}