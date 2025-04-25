import { Request, Response, NextFunction } from "express";
import CryptoService from "@/core/services/encryption/";
import { AppError } from "@/core/error/Apperrors";
import { User } from "@/Api/Users/model/users";



export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("No token provided", 401);
  }

  const token = header.substring(7);
  try {
    const userId = CryptoService.decryptId(token);
    const userExist = await User.findById(userId);

    if (!userExist) {
      throw new AppError("User not found", 404);
    }

    req.userId = userExist._id.toString();
    next();
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }
}
