import { 
  createBulkPreRestrictionOperation, 
  createGeoQueries 
} from "../../../src/cron/utils/geoUtils";
import { SellerType } from "../../../src/models/enums/sellerType";
import { ISanctionedRegion, ISeller } from "../../../src/types";

describe("createBulkPreRestrictionOperation function", () => {
  it("should create update operations for sellers in restricted regions", () => {
    const sellersInRestrictedRegions: Partial<ISeller>[] = [
      { seller_id: "0a0a0a-0a0a-0a0a", seller_type: SellerType.Test },
      { seller_id: "0b0b0b-0b0b-0b0b", seller_type: SellerType.Restricted },
    ];

    const result = createBulkPreRestrictionOperation(sellersInRestrictedRegions as ISeller[]);

    expect(result).toEqual([
      {
        updateOne: {
          filter: { seller_id: "0a0a0a-0a0a-0a0a" },
          update: { $set: { isPreRestricted: true, pre_restriction_seller_type: SellerType.Test } },
        },
      },
      {
        updateOne: {
          filter: { seller_id: "0b0b0b-0b0b-0b0b" },
          update: { $set: { isPreRestricted: true } },
        },
      },
    ]);
  });

  it("should return an empty array if there are no sellers", () => {
    const result = createBulkPreRestrictionOperation([]);

    expect(result).toEqual([]);
  });
});

describe("createGeoQueries function", () => {
  it("should create geo queries for sanctioned regions", () => {
    const sanctionedRegions: Partial <ISanctionedRegion>[] = [
      {
        boundary: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ] as unknown as [[[number, number]]],
        },
        location: {} as any,
      },
    ];

    const result = createGeoQueries(sanctionedRegions as ISanctionedRegion[]);

    expect(result).toEqual([
      {
        sell_map_center: {
          $geoWithin: {
            $geometry: sanctionedRegions[0].boundary,
          },
        },
      },
    ]);
  });

  it("should return an empty array if no regions are passed", () => {
    const result = createGeoQueries([]);
    
    expect(result).toEqual([]);
  });
});