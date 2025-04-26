import { Router } from 'express'
import { authenticate } from '@/core/middleware/authmiddleware'
import { RoleGuard } from '@/core/middleware/roleMiddleware'
import { createSubscription } from '../services/create.subscription'
import { deleteSubscription } from '../services/delete.sub'
import { getAllSubscriptions } from '../services/get.all.subs'
import { getOneSubscription } from '../services/get.one.sub'
import { updateSubscription } from '../services/update.sub'

export const subscriptionRouter = Router()

subscriptionRouter.use(authenticate)
RoleGuard.allow('admin', 'user')

subscriptionRouter.post("/createSubcription", createSubscription)
subscriptionRouter.delete("/deleteSubscription", deleteSubscription)
subscriptionRouter.get("/getallSubscription", getAllSubscriptions)
subscriptionRouter.get("/getOneSubscription/:id", getOneSubscription)
subscriptionRouter.put("/updateSubscription/:id", updateSubscription)



