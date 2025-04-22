
import { Request, Response, NextFunction } from 'express';
import CryptoService from '@/core/services/encryption/';
import { AppError } from '@/core/error/Apperrors'

export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const header = req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = header.substring(7);  
    try {
        const userId = CryptoService.decryptId(token);
        (req as any).userId = userId;     
        next();
    } catch (err) {
        throw new AppError('Invalid or expired token', 401);
    }
}
