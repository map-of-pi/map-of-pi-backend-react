import { Types } from 'mongoose';
import { WatchAdsSession } from '../models/WatchAdsSession';
import { WATCH_ADS_SESSION_STATUS } from '../models/enums/watchAds';

type CreateOpts = {
  status?: string;          // should be WATCH_ADS_SESSION_STATUS.Running
  totalSegments?: number;   // default 20
  segmentSecs?: number;     // default 30
  expiresAt?: Date;         // default now + 24h
};

export async function findActiveSession(userId: Types.ObjectId) {
  return WatchAdsSession.findOne({
    userId,
    status: WATCH_ADS_SESSION_STATUS.Running,
  }).lean();
}

export async function createSession(userId: Types.ObjectId, opts: CreateOpts = {}) {
  const now = Date.now();
  const {
    status = WATCH_ADS_SESSION_STATUS.Running,
    totalSegments = 20,
    segmentSecs = 30,
    expiresAt = new Date(now + 24 * 60 * 60 * 1000),
  } = opts;

  try {
    const doc = await WatchAdsSession.create({
      userId,
      status,
      totalSegments,
      segmentSecs,
      completedSegments: 0,
      earnedSecs: 0,
      startedAt: new Date(now),
      expiresAt,
    });
    return doc.toObject();
  } catch (err: any) {
    // Partial unique index (userId, status='running') can throw if a race occurs.
    if (err?.code === 11000) {
      // Return the existing active session instead of failing.
      const existing = await findActiveSession(userId);
      if (existing) return existing;
    }
    throw err;
  }
}
