import { createUser } from "../services/create.one.user";

import { Router } from "express";
import { userValidationSchema } from "./schemas";
import { loginUser } from "../services/login.in.user";
import { forgetPassword } from "../services/forgot.password";
import { authenticate } from "@/core/middleware/authmiddleware";
import { getUser } from "../services/get.One.users";
import { updateUser } from "../services/update.user";
import { validateOtp } from "../services/valid.otp";

export const userRouter = Router();

userRouter.post("/create", userValidationSchema, createUser);
userRouter.post("/login", loginUser);
userRouter.post('/forgerpassword', forgetPassword)
userRouter.post('/validateOtp', validateOtp)

userRouter.use(authenticate)
userRouter.get("/getme", getUser)
userRouter.put("/upadate-user",updateUser)

