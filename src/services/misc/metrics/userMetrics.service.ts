import User from "../../../models/User";
import ReviewFeedback from "../../../models/ReviewFeedback";
import { RatingScale } from "../../../models/enums/ratingScale";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export const getTotalUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const totalUsers = await User.find().countDocuments();
  const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

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

  return {
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
      hasPrevPage },
  };
};

export const getUserStats = async () => {
  const fetchUsersByIds = async (userIds: string[]) => {
    return await User.find({ pi_uid: { $in: userIds } }).select("pi_uid pi_username user_name");
  };

  // Get aggregated review data
  const mostReviewsReceived = await ReviewFeedback.aggregate([
    { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  
  const mostReviewsGiven = await ReviewFeedback.aggregate([
    { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const mostTrustworthyReviewsReceived = await ReviewFeedback.aggregate([
    { $match: { rating: RatingScale.DELIGHT } },
    { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const mostTrustworthyReviewsGiven = await ReviewFeedback.aggregate([
    { $match: { rating: RatingScale.DELIGHT } },
    { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const mostDespairReviewsReceived = await ReviewFeedback.aggregate([
    { $match: { rating: RatingScale.DESPAIR } },
    { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const mostDespairReviewsGiven = await ReviewFeedback.aggregate([
    { $match: { rating: RatingScale.DESPAIR } },
    { $group: { _id: "$review_giver_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Fetch users by aggregated review data
  const mostReviewsReceivedUsers = await fetchUsersByIds(mostReviewsReceived.map(user => user._id));
  const mostReviewsGivenUsers = await fetchUsersByIds(mostReviewsGiven.map(user => user._id));
  const mostTrustworthyReviewsReceivedUsers = await fetchUsersByIds(mostTrustworthyReviewsReceived.map(user => user._id));
  const mostTrustworthyReviewsGivenUsers = await fetchUsersByIds(mostTrustworthyReviewsGiven.map(user => user._id));
  const mostDespairReviewsReceivedUsers = await fetchUsersByIds(mostDespairReviewsReceived.map(user => user._id));
  const mostDespairReviewsGivenUsers = await fetchUsersByIds(mostDespairReviewsGiven.map(user => user._id));

  return {
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
  };
};
