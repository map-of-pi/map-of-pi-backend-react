import { Router } from 'express';
import { saveMapCenter, getMapCenter } from '../controllers/mapCenterController';

const mapCenterRoutes = Router();

// Route to get the map center for a specific user
mapCenterRoutes.get('/:pi_uid', getMapCenter);

// Route to save or update the map center
mapCenterRoutes.post('/', saveMapCenter);

export default mapCenterRoutes;
