import SanctionedRegion from "../../models/misc/SanctionedRegion";

export const validateSellerLocation = async (longitude: number, latitude: number)  => {
	const sellCenter = {
		type: 'Point' as const,
		coordinates: [longitude, latitude],
	};

	const isSanctionedLocation = await SanctionedRegion.findOne({
		boundary: {
			$geoIntersects: {
				$geometry: sellCenter
			}
		}
	}).exec();

	return isSanctionedLocation;
};
