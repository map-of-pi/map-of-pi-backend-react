import MapCenter from "../models/MapCenter";

export const createOrUpdateMapCenter = async (pi_uid: string, latitude: number, longitude: number) => {
  if (!pi_uid || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required fields');
  }
  const mapCenter = await MapCenter.findOneAndUpdate(
    { pi_uid },
    { latitude, longitude },
    { new: true, upsert: true }
  );
  return mapCenter;
};
