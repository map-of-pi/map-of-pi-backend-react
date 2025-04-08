

import { Request, Response } from "express";
import Seller from "../../models/Seller";
// import logger from "../../config/loggingConfig";

export const getSellerStatistics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    
    const skip = (page - 1) * limit;
    const totalSellers = await Seller.countDocuments();
    const sellers = await Seller.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalSellers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeSellersCount = await Seller.countDocuments({ seller_type: "activeSeller" });
    const inactiveSellers = await Seller.countDocuments({ seller_type: "inactiveSeller" });
    const testSellers = await Seller.countDocuments({ seller_type: "testSeller" });

    const sellerGrowthThisMonth = await Seller.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$seller_type",
          count: { $sum: 1 },
        },
      },
    ]);

    const sellerGrowthByTypeThisMonth = sellerGrowthThisMonth.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const newSellersThisMonth = sellerGrowthThisMonth.reduce((sum, item) => sum + item.count, 0);

    const percentageGrowthThisMonth =
        totalSellers > 0 ? (newSellersThisMonth / totalSellers) * 100 : 0;
      
          const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const sellerGrowth = await Seller.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const data = sellerGrowth.map((growth) => {
      return {
        month: months[growth._id - 1],
        count: growth.count,
      };
    });

    const shopDetails = sellers.map(seller => ({
      name: seller.name,
      owner: seller.seller_id,
      category: seller.seller_type, 
      rating: parseFloat(seller.average_rating.toString()),
      status: seller.order_online_enabled_pref ? "Active" : "Inactive",
      address: seller.address,
      coordinates: seller.sell_map_center.coordinates,
    }));


    const statistics = {
      totalSellers,
      sellers:shopDetails,
      activeSellers: activeSellersCount,
      inactiveSellers,
      testSellers,
      newSellersThisMonth,
      percentageGrowthThisMonth: percentageGrowthThisMonth.toFixed(2), 
      sellerGrowthByTypeThisMonth: {
        activeSeller: sellerGrowthByTypeThisMonth["activeSeller"] || 0,
        inactiveSeller: sellerGrowthByTypeThisMonth["inactiveSeller"] || 0,
        testSeller: sellerGrowthByTypeThisMonth["testSeller"] || 0,
        },
      sellerGrowth: data,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    // logger.info("Fetched seller statistics for the current month successfully", statistics);

    return res.status(200).json(statistics);
  } catch (error) {
    // logger.error("Failed to fetch seller statistics:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching seller statistics; please try again later." });
  }
};
