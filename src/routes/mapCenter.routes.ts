import { Router } from 'express';
import { saveMapCenter, getMapCenter } from '../controllers/mapCenterController';
import { verifyToken } from '../middlewares/verifyToken';

const mapCenterRoutes = Router();

// Route to get the map center for a specific user
mapCenterRoutes.get('/:pi_uid', verifyToken, getMapCenter);

// Route to save or update the map center
mapCenterRoutes.put('/save', verifyToken, saveMapCenter);

export default mapCenterRoutes;
