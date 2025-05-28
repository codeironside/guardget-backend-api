import { createUser } from "../services/create.one.user";

import { Router } from "express";
import { userValidationSchema } from "./schemas";
import { loginUser } from "../services/login.in.user";
import { forgetPassword } from "../services/forgot.password";
import { authenticate } from "@/core/middleware/authmiddleware";
import { getUser } from "../services/get.One.users";
import { updateUser } from "../services/update.user";
import { validateOtp } from "../services/valid.otp";
import { uploadImage } from "../services/upload.profile.picture";
import { resendOtp } from "../services/resend.otp";
import { searchUsers } from "../services/user.recommender";
import { getRecentContactsEndpoint } from "../services/user.recommender";
import { verifyResetOTP } from "../services/reset.password";

export const userRouter = Router();

userRouter.post("/create", userValidationSchema, createUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgetpassword", forgetPassword);
userRouter.post("/reset-password", verifyResetOTP);
userRouter.post("/validateOtp", validateOtp);
userRouter.post("/resendOtp", resendOtp); // In your router setup
userRouter.get("/search", authenticate, searchUsers);
userRouter.get("/recent-contacts", authenticate, getRecentContactsEndpoint);
userRouter.get("/getme", authenticate, getUser);
userRouter.put("/update-user", authenticate, updateUser);
userRouter.put("/upload-profile-picture", authenticate, uploadImage);
