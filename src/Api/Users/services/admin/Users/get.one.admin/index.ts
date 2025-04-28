// src/Api/Users/services/admin/Users/get.one.admin/index.ts
import { Request, Response } from "express";
import { User } from "@/Api/Users/model/users";
import { Device } from "@/Api/Device/models";
import { Receipt } from "@/Api/Financial/model";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

interface UserFacets {
  totalUsers: { count: number }[];
  activeUsers: { count: number }[];
  subscriptionTiers: { _id: string; count: number }[];
  recentUsers: {
    _id: string;
    username: string;
    email: string;
    createdAt: Date;
    subscriptionStatus: string;
  }[];
}

interface DeviceFacets {
  totalDevices: { count: number }[];
  byStatus: { _id: string; count: number }[];
  byType: { _id: string; count: number }[];
  recentDevices: {
    _id: string;
    name: string;
    status: string;
    createdAt: Date;
  }[];
}

interface ReceiptFacets {
  totalReceipts: { count: number }[];
  totalRevenue: { revenue: number }[];
  recentReceipts: {
    _id: string;
    userId: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
}

const getFirstValue = <T>(arr?: T[]): T | undefined => arr?.[0];

export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [users, devices, receipts] = await Promise.all([
      User.aggregate<UserFacets>([
        {
          $facet: {
            totalUsers: [{ $count: "count" }],
            activeUsers: [{ $match: { subActive: true } }, { $count: "count" }],
            subscriptionTiers: [
              {
                $lookup: {
                  from: "subscriptions",
                  localField: "subId",
                  foreignField: "_id",
                  as: "subscription",
                },
              },
              {
                $unwind: {
                  path: "$subscription",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $group: {
                  _id: {
                    $ifNull: ["$subscription.name", "No Subscription"],
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            recentUsers: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  createdAt: 1,
                  subscriptionStatus: {
                    $cond: {
                      if: "$subActive",
                      then: "Active",
                      else: "Inactive",
                    },
                  },
                },
              },
            ],
          },
        },
      ]),
      // Corrected Device aggregation
      // Corrected Device aggregation
      Device.aggregate<DeviceFacets>([
        {
          $facet: {
            totalDevices: [{ $count: "count" }],
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }], // Added double closing braces
            byType: [{ $group: { _id: "$Type", count: { $sum: 1 } } }], // Added double closing braces
            recentDevices: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              { $project: { _id: 1, name: 1, status: 1, createdAt: 1 } },
            ],
          },
        },
      ]),

      // Corrected Receipt aggregation
      Receipt.aggregate<ReceiptFacets>([
        {
          $facet: {
            totalReceipts: [{ $count: "count" }],
            totalRevenue: [
              { $group: { _id: null, revenue: { $sum: "$amount" } } },
            ], // Added double closing braces
            recentReceipts: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  userId: 1,
                  amount: 1,
                  status: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]),
    ]);

    const response = {
      users: {
        total: getFirstValue(users[0]?.totalUsers)?.count ?? 0,
        active: getFirstValue(users[0]?.activeUsers)?.count ?? 0,
        subscriptionTiers: users[0]?.subscriptionTiers ?? [],
        recent: users[0]?.recentUsers ?? []
      },
      devices: {
        total: getFirstValue(devices[0]?.totalDevices)?.count ?? 0,
        byStatus: devices[0]?.byStatus ?? [],
        byType: devices[0]?.byType ?? [],
        recent: devices[0]?.recentDevices ?? []
      },
      receipts: {
        total: getFirstValue(receipts[0]?.totalReceipts)?.count ?? 0,
        revenue: getFirstValue(receipts[0]?.totalRevenue)?.revenue ?? 0,
        recent: receipts[0]?.recentReceipts ?? []
      }
    };

    logger.info("Admin dashboard fetched");
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const data ={ message, stack: error instanceof Error ? error.stack : undefined }
    logger.error(`${data}`);
    
    const status = error instanceof BadRequestError ? 400 : 500;
    res.status(status).json({ 
      status: status === 400 ? "Bad Request" : "Error",
      message: status === 400 ? message : "Internal server error"
    });
  }
};