import { userRouter } from "@/Api/Users/routers";
import { adminRouter } from "@/Api/Users/services/admin/routes";
import {  Router } from "express";


const router = Router();


//user Router
router.use("/users", userRouter)

//admin Router
router.use("/admin", adminRouter)


export default router;

