import { Request, Response } from "express";
import { WatchAdsSessionStatus } from "../models/enums/watchAds";
import * as WatchAdsSessionService from "../services/watchAdsSession.service";
import logger from "../config/loggingConfig";

// POST /api/v1/watch-ads/session
export const startWatchAdsSession = async (req: Request, res: Response) => {
  const authUser = req.currentUser;
  if (!authUser) {
    logger.warn("No authenticated user found when trying to start watch-ads session.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Step 1: Check if user already has an active session
    const activeSession = await WatchAdsSessionService.findActiveSession(authUser._id);
    if (activeSession) {
      return res.json(activeSession);
    }

    // Step 2: Create a new session with default config
    const newSession = await WatchAdsSessionService.createSession(authUser._id, {
      status: WatchAdsSessionStatus.Running,
      totalSegments: 20,
      segmentSecs: 30,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // SESSION_TTL = 24h
    });

    return res.status(201).json(newSession);
  } catch (err) {
    logger.error("Error starting watch-ads session", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/v1/watch-ads/session
export const getActiveWatchAdsSession = async (req: Request, res: Response) => {
  const authUser = req.currentUser;
  if (!authUser) {
    logger.warn("No authenticated user found when trying to fetch watch-ads session.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const activeSession = await WatchAdsSessionService.findActiveSession(authUser._id);
    return res.json(activeSession || null);
  } catch (err) {
    logger.error("Error fetching watch-ads session", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
