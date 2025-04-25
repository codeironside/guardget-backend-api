export const API_SUFFIX = "/api/v1";
export const day = new Date().toISOString();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}