import { Router } from "express";
import { getTotalUser, getUserStatistics } from "../controllers/statistics/user-statistics";
import { getSellerStatistics } from "../controllers/statistics/seller-statistics";
import { getReviewStatistics } from "../controllers/statistics/review-statistics";
import { getRestrictedAreaStats } from "../controllers/statistics/restricted-countries-statistics";



const statisticRoutes = Router()

statisticRoutes.get("/users",getTotalUser)
statisticRoutes.get("/top-reviewer-stats",getUserStatistics)
statisticRoutes.get("/sellers-stats",getSellerStatistics)
statisticRoutes.get("/review-stats",getReviewStatistics)
statisticRoutes.get("/banned-countries",getRestrictedAreaStats)



export default statisticRoutes