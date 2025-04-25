import { createUser } from "../services/create.one.user";

import { Router } from "express";
import { userValidationSchema } from "./schemas";

export const userRouter = Router();


userRouter.post("/create",userValidationSchema, createUser);