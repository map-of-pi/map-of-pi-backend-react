import { SellerType } from "../../models/enums/sellerType";
import { ISanctionedRegion, ISeller } from "../../types";

export function createBulkPreRestrictionOperation(sellersToEvaluate
                                                      : ISeller[]) {
  return sellersToEvaluate.map(seller => {
    // Create a single update object for $set that includes both fields.
    const setObj: any = { isPreRestricted: true };
    if (seller.seller_type !== SellerType.Restricted) {
        // Copy seller type value into pre_restriction_seller_type field.
        setObj.pre_restriction_seller_type = seller.seller_type;
    }
    return {
      updateOne: {
        filter: { seller_id: seller.seller_id },
        update: { $set: setObj },
      }
    };
  });
}

export function createGeoQueries(sanctionedRegions: ISanctionedRegion[]) {
  return sanctionedRegions.map(region => ({
    sell_map_center: {
      $geoWithin: {
        $geometry: region.boundary,
      }
    }
  }));
}