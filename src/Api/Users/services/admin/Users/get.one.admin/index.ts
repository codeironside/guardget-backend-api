import { User } from "@/Api/Users/model/users";
import { Receipt } from "@/Api/Financial/model";
import { Device } from "@/Api/Device/models";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import { Types } from "mongoose";

interface RecentUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  createdAt: Date;
  subscriptionStatus: string;
}


interface RecentReceipt {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  status: string;
  createdAt: Date;
}

export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [users, devices, subscriptions, receipts] = await Promise.all([
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            active: [{ $match: { subActive: true } }, { $count: "count" }],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  createdAt: 1,
                  subscriptionStatus: {
                    $cond: ["$subActive", "Active", "Inactive"],
                  },
                },
              },
            ],
          },
        },
      ]),
      Device.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  deviceId: 1,
                  user: 1,
                  status: 1,
                  lastActive: 1,
                },
              },
            ],
          },
        },
      ]),
      User.aggregate([
        {
          $facet: {
            active: [{ $match: { subActive: true } }, { $count: "count" }],
            revenue: [
              { $match: { subActive: true } },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$subAmount" },
                  monthly: { $sum: "$subMonthlyAmount" },
                },
              },
            ],
            expiring: [
              {
                $match: {
                  subActive: true,
                  subActiveTill: { $lte: new Date(Date.now() + 30 * 86400000) },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]),
      Receipt.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            revenue: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
                  monthly: { $sum: "$monthlyAmount" },
                },
              },
            ],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  user: 1,
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

    // Type the aggregation results
    const response = {
      users: {
        total: users[0]?.total[0]?.count || 0,
        active: users[0]?.active[0]?.count || 0,
        recent: (users[0]?.recent || []) as RecentUser[],
      },
      devices: {
        total: devices[0]?.total[0]?.count || 0,
        byStatus: devices[0]?.byStatus || [],
        recent: devices[0]?.recent || [],
      },
      subscriptions: {
        active: subscriptions[0]?.active[0]?.count || 0,
        revenue: subscriptions[0]?.revenue[0] || { total: 0, monthly: 0 },
        expiring: subscriptions[0]?.expiring[0]?.count || 0,
      },
      receipts: {
        total: receipts[0]?.total[0]?.count || 0,
        revenue: receipts[0]?.revenue[0] || { total: 0, monthly: 0 },
        recent: (receipts[0]?.recent || []) as RecentReceipt[],
      },
      recentActivity: [
        ...(users[0]?.recent || []).map((u: RecentUser) => ({
          type: "user",
          ...u,
          createdAt: u.createdAt.getTime(),
        })),
        ...(receipts[0]?.recent || []).map((r: RecentReceipt) => ({
          type: "receipt",
          ...r,
          createdAt: r.createdAt.getTime(),
        })),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
    };

    logger.info("Admin dashboard data fetched");
    res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error}`);
    throw new BadRequestError(
      `Dashboard error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
