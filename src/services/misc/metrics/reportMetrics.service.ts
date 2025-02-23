import SanctionedRegion from "../../../models/misc/SanctionedRegion";
import { ISanctionedRegion } from "../../../types";

export const getAllRestrictedAreas = async (): Promise<ISanctionedRegion[]> => {
  const restrictedAreas = await SanctionedRegion.find();
  return restrictedAreas;
};

export const addSanctionedRegion = async (
  location: string, 
  boundary: number[][][]
): Promise<ISanctionedRegion> => {
  const newSanctionedRegion = await SanctionedRegion.create({
    location,
    boundary: {
      type: "Polygon",
      coordinates: boundary,
    },
  });

  return newSanctionedRegion;
};