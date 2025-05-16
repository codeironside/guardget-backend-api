import { Request, Response } from "express";
import { User } from "@/Api/Users/model/users";
import { TransferredDeviceModel } from "@/Api/Device/models/transfer_history";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import { Types } from "mongoose";

/**
 * User search result interface matching frontend expectations
 */
interface UserSearchResult {
  id: Types.ObjectId;
  username: string;
  email: string;
  imageurl?: string;
  firstName?: string;
  surName?: string;
  middleName?: string;
}

/**
 * Search for users based on query or   recent contacts if no query provided
 * This endpoint supports the autosuggest feature in the frontend
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    const currentUserId = new Types.ObjectId(req.userId!);

    // Track metrics for API usage
    Logger.info(
      `User search API called by user ${req.userId} with query: "${
        query || "empty"
      }"`
    );

    // If no query is provided or query is empty,   recent contacts
    if (!query || query.trim() === "") {
      await getRecentContacts(currentUserId, res);
    }

    // Short queries need special handling for better UX
    if (query.length < 2) {
      // Allow searching with @ symbol even with only one character
      if (!query.includes("@")) {
        res.json({
          status: "success",
          data: [] as UserSearchResult[],
        });
      }
    }

    // Escape special regex characters to prevent ReDoS attacks
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    // Optimize for different query types
    let users: UserSearchResult[];

    if (query.includes("@")) {
      // Email-focused search is more direct and efficient
      users = await User.find({
        _id: { $ne: currentUserId },
        email: { $regex: searchRegex },
      })
        .select("_id username email imageurl role firstName surName middleName")
        .limit(10)
        .lean()
        .then(
          (results) =>
            results.map((user) => ({
              ...user,
              id: user._id,
              _id: undefined,
            })) as unknown as UserSearchResult[]
        );
    } else {
      // Full name/username search with relevance scoring
      users = await User.aggregate<UserSearchResult>([
        {
          $match: {
            $and: [
              { _id: { $ne: currentUserId } },
              {
                $or: [
                  { email: { $regex: searchRegex } },
                  { username: { $regex: searchRegex } },
                  { firstName: { $regex: searchRegex } },
                  { surName: { $regex: searchRegex } },
                ],
              },
            ],
          },
        },
        // Calculate relevance score for better sorting
        {
          $addFields: {
            relevanceScore: {
              $add: [
                // Exact matches
                {
                  $cond: [
                    { $eq: [{ $toLower: "$email" }, query.toLowerCase()] },
                    100,
                    0,
                  ],
                },
                {
                  $cond: [
                    { $eq: [{ $toLower: "$username" }, query.toLowerCase()] },
                    90,
                    0,
                  ],
                },

                // Starts with (highest priority for partial matches)
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$email" },
                        regex: new RegExp(`^${escapedQuery}`, "i"),
                      },
                    },
                    80,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$username" },
                        regex: new RegExp(`^${escapedQuery}`, "i"),
                      },
                    },
                    70,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$firstName" },
                        regex: new RegExp(`^${escapedQuery}`, "i"),
                      },
                    },
                    60,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$surName" },
                        regex: new RegExp(`^${escapedQuery}`, "i"),
                      },
                    },
                    50,
                    0,
                  ],
                },

                // Contains (lower priority)
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$email" },
                        regex: searchRegex,
                      },
                    },
                    40,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$username" },
                        regex: searchRegex,
                      },
                    },
                    30,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$firstName" },
                        regex: searchRegex,
                      },
                    },
                    20,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $toLower: "$surName" },
                        regex: searchRegex,
                      },
                    },
                    10,
                    0,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1 } },
        {
          $project: {
            _id: 0,
            id: "$_id",
            username: 1,
            email: 1,
            imageurl: 1,
            role: 1,
            firstName: 1,
            surName: 1,
            middleName: 1,
          },
        },
        { $limit: 10 },
      ]);
    }

    //   results to the frontend
    res.json({
      status: "success",
      data: users,
    });
  } catch (error) {
    Logger.error(`User search failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "User search failed"
    );
  }
};

/**
 * Get recent contacts for the current user to show as initial suggestions
 * This supports the frontend's autosuggest when the field is focused
 */
export const getRecentContacts = async (
  currentUserId: Types.ObjectId,
  res: Response
) => {
  try {
    // Attempt to find recent transfer history first
    let recentUserIds: string[] = [];

    // Get recent device transfers involving the current user
    try {
      const recentTransfers = await TransferredDeviceModel.find({
        $or: [{ fromID: currentUserId }, { toID: currentUserId }],
      })
        .sort({ transferDate: -1 })
        .limit(20)
        .lean();

      // Extract unique user IDs from transfers
      const userIdSet = new Set<string>();

      recentTransfers.forEach((transfer) => {
        if (
          transfer.fromID &&
          transfer.fromID.toString() === currentUserId.toString()
        ) {
          if (transfer.toID) userIdSet.add(transfer.toID.toString());
        } else if (
          transfer.toID &&
          transfer.toID.toString() === currentUserId.toString()
        ) {
          if (transfer.fromID) userIdSet.add(transfer.fromID.toString());
        }
      });

      recentUserIds = Array.from(userIdSet).slice(0, 5);
      Logger.info(
        `Found ${recentUserIds.length} recent transfer contacts for user ${currentUserId}`
      );
    } catch (error) {
      Logger.warn(`Error fetching transfer history: ${error}`);
      // Continue with fallback approach if this fails
    }

    // If we have recent contacts from transfers, retrieve their details
    if (recentUserIds.length > 0) {
      try {
        const objectIdArray = recentUserIds.map((id) => new Types.ObjectId(id));
        const recentContacts = await User.find({
          _id: { $in: objectIdArray },
        })
          .select("_id username email imageurl role firstName surName middleName")
          .limit(5)
          .lean();

        const formattedContacts = recentContacts.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          imageurl: user.imageurl,
          role: user.role,
          firstName: user.firstName,
          surName: user.surName,
          middleName: user.middleName,
        }));

        res.json({
          status: "success",
          data: formattedContacts,
        });
      } catch (error) {
        Logger.warn(
          `Error fetching user details for recent contacts: ${error}`
        );
        // Continue with fallback approach if this fails
      }
    }

    // Fallback:   some recently active verified users
    try {
      const activeUsers = await User.find({
        _id: { $ne: currentUserId },
        emailVerified: true,
      })
        .sort({ createdAt: -1 })
        .select("_id username email imageurl role firstName surName middleName")
        .limit(5)
        .lean();

      const formattedUsers = activeUsers.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        imageurl: user.imageurl,
        role: user.role,
        firstName: user.firstName,
        surName: user.surName,
        middleName: user.middleName,
      }));

      Logger.info(` ing ${formattedUsers.length} active users as suggestions`);

      res.json({
        status: "success",
        data: formattedUsers,
      });
    } catch (error) {
      Logger.error(`Failed to get active users: ${error}`);

      // If all else fails,   empty array to avoid breaking the frontend
      res.json({
        status: "success",
        data: [],
      });
    }
  } catch (error) {
    Logger.error(`Recent contacts retrieval failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error
        ? error.message
        : "Recent contacts retrieval failed"
    );
  }
};

/**
 * Standalone endpoint for getting recent contacts
 * Used by the frontend when the email input is first focused
 */
export const getRecentContactsEndpoint = async (
  req: Request,
  res: Response
) => {
  try {
    const currentUserId = new Types.ObjectId(req.userId!);
    Logger.info(`Recent contacts endpoint called by user ${req.userId}`);
    await getRecentContacts(currentUserId, res);
  } catch (error) {
    Logger.error(`Recent contacts endpoint failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error
        ? error.message
        : "Recent contacts retrieval failed"
    );
  }
};
