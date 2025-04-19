import {Request, Response} from "express";
import logger from "../config/loggingConfig";
import SanctionedRegion from "../models/misc/SanctionedRegion";

export async function checkIfPointInRegion(req: Request, res: Response) {
	const { latitude, longitude } = req.body;

	if (typeof latitude !== 'number' || typeof longitude !== 'number') {
		return res.status(400).json({ error: 'Invalid coordinates provided.' });
	}

	try {
		// Build a GeoJSON Point for the query (lon/lat order!).
		const point = {
			type: 'Point' as const,
			coordinates: [longitude, latitude],
		};

		// Ask MongoDB if any `boundary` polygon intersects this point.
		const matchingRegion = await SanctionedRegion.findOne({
			boundary: {
				$geoIntersects: {
					$geometry: point
				}
			}
		}).exec();

		const isRestricted = !!matchingRegion;
		logger.info(`User at [${latitude},${longitude}] is ${isRestricted ? '' : 'not '}in a restricted zone.`);
		return res.status(200).json({
			message: `Sell center is set within a ${isRestricted ? 'restricted' : 'clear' } zone`,
			isRestricted
		});
	} catch (error) {
		logger.error('Error checking sanctioned location:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
}