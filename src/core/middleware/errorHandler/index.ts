import { Request, Response,NextFunction} from 'express'


export const errorHandler = (
    err: any, req:Request, res:Response,  next:NextFunction
)=> {
    if (res.headersSent) return next(err)
    const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    res.status(status).json({
        status: status < 500 ? 'fail' : 'error',
        message: err.message || 'Internal Server Error'
    })
}