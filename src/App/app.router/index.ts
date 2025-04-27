import { userRouter } from "@/Api/Users/routers";
import { adminRouter } from "@/Api/Users/services/admin/routes";
import { deviceRouter } from "@/Api/Device/routes";
import { subscriptionRouter } from "@/Api/Subscription/routes";
import {  Router } from "express";
import { financialRouter } from "@/Api/Financial/routes";


const router = Router();


//user Router
router.use("/users", userRouter)

//admin Router
router.use("/admin", adminRouter)

//subscription Router
router.use("/subscription", subscriptionRouter)

//device Router
router.use("/device", deviceRouter)

//payment
router.use("/payment", financialRouter)


export default router;

