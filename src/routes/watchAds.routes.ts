import { Router } from 'express';
import { startWatchAdsSession } from '../controllers/watchAdsSessionController';

const router = Router();

// start/resume endpoint
router.post('/watch-ads/session', startWatchAdsSession);

export default router;