import { Request, Response } from "express";
import User from "../../models/User";
import ReviewFeedback from "../../models/ReviewFeedback";
import { RatingScale } from "../../models/enums/ratingScale";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";


export const getTotalUser = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const skip = (page - 1) * limit;
    const totalUsers = await User.find().countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const activeUsers = await User.find({ updatedAt: { $gte: oneMonthAgo } }).countDocuments();

    const startOfCurrentMonth = startOfMonth(new Date());
    const endOfCurrentMonth = endOfMonth(new Date());
    const newUsers = await User.find({
      createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
    }).countDocuments();

    const startOfCurrentYear = startOfYear(new Date());
    const endOfCurrentYear = endOfYear(new Date());
    const userGrowth = [];
    const userChangePercentage = []; 

    let previousMonthCount = 0; 

    for (let month = 0; month < 12; month++) {
      const start = startOfMonth(new Date(new Date().setMonth(month, 1)));
      const end = endOfMonth(start);

      if (start >= startOfCurrentYear && start <= endOfCurrentYear) {
        const count = await User.find({ createdAt: { $gte: start, $lte: end } }).countDocuments();

        const percentageChange = previousMonthCount
          ? ((count - previousMonthCount) / previousMonthCount) * 100
          : 0;

        userGrowth.push({
          name: start.toLocaleString("default", { month: "short" }),
          total: count,
        });

        userChangePercentage.push({
          name: start.toLocaleString("default", { month: "short" }),
          percentage: parseFloat(percentageChange.toFixed(2)), 
        });

        previousMonthCount = count;
      }
    }

    return res.status(200).json({
      totalUsers,
      activeUsers,
      newUsers,
      userGrowth,
      userChangePercentage, 
      users,
      pagination: {
        currentPage: page,
        totalUsers,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch user data",
      error: error.message,
    });
  }
};


export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const fetchUsers = async (userIds: string[]) => {
      return await User.find({ pi_uid: { $in: userIds } }).select("pi_uid pi_username user_name");
    };

    const mostReviewsReceived = await ReviewFeedback.aggregate([
      { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }, 
    ]);

    const mostReviewsReceivedUsers = await fetchUsers(mostReviewsReceived.map(user => user._id));

    const mostReviewsGiven = await ReviewFeedback.aggregate([
      { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostReviewsGivenUsers = await fetchUsers(mostReviewsGiven.map(user => user._id));

    const mostTrustworthyReviewsReceived = await ReviewFeedback.aggregate([
      { $match: { rating: RatingScale.DELIGHT } },
      { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostTrustworthyReviewsReceivedUsers = await fetchUsers(
      mostTrustworthyReviewsReceived.map(user => user._id)
    );

    const mostTrustworthyReviewsGiven = await ReviewFeedback.aggregate([
      { $match: { rating: RatingScale.DELIGHT } },
      { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostTrustworthyReviewsGivenUsers = await fetchUsers(
      mostTrustworthyReviewsGiven.map(user => user._id)
    );

    const mostDespairReviewsReceived = await ReviewFeedback.aggregate([
      { $match: { rating: RatingScale.DESPAIR } },
      { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostDespairReviewsReceivedUsers = await fetchUsers(
      mostDespairReviewsReceived.map(user => user._id)
    );

    const mostDespairReviewsGiven = await ReviewFeedback.aggregate([
      { $match: { rating: RatingScale.DESPAIR } },
      { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostDespairReviewsGivenUsers = await fetchUsers(
      mostDespairReviewsGiven.map(user => user._id)
    );

    res.status(200).json({
      mostReviewsReceived: mostReviewsReceivedUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostReviewsReceived[index]?.count || 0,
      })),
      mostReviewsGiven: mostReviewsGivenUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostReviewsGiven[index]?.count || 0,
      })),
      mostTrustworthyReviewsReceived: mostTrustworthyReviewsReceivedUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostTrustworthyReviewsReceived[index]?.count || 0,
      })),
      mostTrustworthyReviewsGiven: mostTrustworthyReviewsGivenUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostTrustworthyReviewsGiven[index]?.count || 0,
      })),
      mostDespairReviewsReceived: mostDespairReviewsReceivedUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostDespairReviewsReceived[index]?.count || 0,
      })),
      mostDespairReviewsGiven: mostDespairReviewsGivenUsers.map((user, index) => ({
        ...user.toObject(),
        count: mostDespairReviewsGiven[index]?.count || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user statistics", error });
  }
};

