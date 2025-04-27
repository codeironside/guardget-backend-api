import { Router } from 'express'
import { authenticate } from '@/core/middleware/authmiddleware'
import { RoleGuard } from '@/core/middleware/roleMiddleware'
import { createSubscription } from '../services/create.subscription'
import { deleteSubscription } from '../services/delete.sub'
import { getAllSubscriptions } from '../services/get.all.subs'
import { getOneSubscription } from '../services/get.one.sub'
import { updateSubscription } from '../services/update.sub'

export const subscriptionRouter = Router()



//public routes
subscriptionRouter.get("/getallSubscription", getAllSubscriptions);
subscriptionRouter.get("/getOneSubscription/:id", getOneSubscription);



subscriptionRouter.post("/createSubcription",authenticate, RoleGuard.allow('admin'),createSubscription)
subscriptionRouter.delete("/deleteSubscription/:id",authenticate , RoleGuard.allow('admin'),authenticate, deleteSubscription)
subscriptionRouter.put("/updateSubscription/:id",authenticate, RoleGuard.allow('admin','user'),authenticate, updateSubscription)



