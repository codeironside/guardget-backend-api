import { userRouter } from "@/Api/Users/routers";
import { adminRouter } from "@/Api/Users/services/admin/routes";
import { deviceRouter } from "@/Api/Device/routes";
import { subscriptionRouter } from "@/Api/Subscription/routes";
import {  Router } from "express";


const router = Router();


//user Router
router.use("/users", userRouter)

//admin Router
router.use("/admin", adminRouter)

//subscription Router
router.use("/subscription", subscriptionRouter)

//device Router
router.use("/device", deviceRouter)


export default router;

