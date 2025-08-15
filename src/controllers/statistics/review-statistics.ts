import { Request, Response } from "express";
import ReviewFeedback from "../../models/ReviewFeedback";
import User from "../../models/User";

export const getReviewStatistics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const skip = (page - 1) * limit;
    const totalReviews = await ReviewFeedback.countDocuments();
    const reviews = await ReviewFeedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalReviews / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const mappedReviews = await Promise.all(
      reviews.map(async (review) => {
        const reviewerUser = await User.findOne({ pi_uid: review.review_giver_id });
        const sellerUser = await User.findOne({ pi_uid: review.review_receiver_id });

        return {
          id: review._id,
          reviewer: reviewerUser?.pi_username ||review.review_giver_id,
          seller: sellerUser?.pi_username || review.review_receiver_id ,
          rating: review.rating,
          comment: review.comment,
          date: review.review_date.toISOString().split("T")[0], 
        };
      })
    );


    const mostReviewedUser = await ReviewFeedback.aggregate([
      { $group: { _id: "$review_receiver_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const user = await User.findOne({
      pi_uid: mostReviewedUser[0]?._id,
    });


    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthReviews = await ReviewFeedback.countDocuments({
      review_date: { $gte: startOfMonth, $lt: startOfNextMonth },
    });

    const currentMonthReviewPercentage =
      totalReviews > 0
        ? ((currentMonthReviews / totalReviews) * 100).toFixed(2)
        : "0.00";

    res.status(200).json({
      reviews:mappedReviews,
      totalReviews,
      mostReviewedUser: {
        user: user || null,
        count: mostReviewedUser[0]?.count || 0,
      },
      currentMonthReviews,
      currentMonthReviewPercentage: `${currentMonthReviewPercentage}`,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        totalReviews
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch review statistics", error });
  }
};

