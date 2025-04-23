import { createUser } from "../services/create.one.user";

import { Router } from "express";

export const userRouter = Router();


userRouter.post("/create", createUser);