import { AppError } from "./Apperrors";

export class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
        this.name='BadRequestError'
    }
}