import { userRouter } from "@/Api/Users/routers";
import {  Router } from "express";


const router = Router();

router.use("/users", userRouter)


export default router;