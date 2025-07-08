import { runSanctionBot } from "../../../src/cron/jobs/sanctionBot";
import { 
  getAllSanctionedRegions
} from "../../../src/services/admin/report.service";
import {
  createBulkPreRestrictionOperation,
  createGeoQueries
} from "../../../src/cron/utils/geoUtils";
import { 
  getSellersToEvaluate,
  processSellersGeocoding,
  processSanctionedSellers,
  processUnsanctionedSellers
} from "../../../src/cron/utils/sanctionUtils";
import Seller from "../../../src/models/Seller";
import { RestrictedArea } from "../../../src/models/enums/restrictedArea";
import { SellerType } from "../../../src/models/enums/sellerType";
import { 
  ISanctionedRegion, 
  ISeller, 
  SanctionedSellerStatus 
} from "../../../src/types";

jest.mock("../../../src/models/Seller");
jest.mock("../../../src/services/admin/report.service", () => ({
  getAllSanctionedRegions: jest.fn()
}));
jest.mock("../../../src/cron/utils/geoUtils", () => {
  const actual = jest.requireActual("../../../src/cron/utils/geoUtils");
  return {
    ...actual,
    createBulkPreRestrictionOperation: jest.fn(),
    createGeoQueries: jest.fn(),
  };
});
jest.mock("../../../src/cron/utils/sanctionUtils", () => {
  const actual = jest.requireActual("../../../src/cron/utils/sanctionUtils");
  return {
    ...actual,
    getSellersToEvaluate: jest.fn(),
    processSellersGeocoding: jest.fn(),
    processSanctionedSellers: jest.fn(),
    processUnsanctionedSellers: jest.fn(),
  };
});

describe("runSanctionBot function", () => {
  const sanctionedRegions: ISanctionedRegion[] = [
    { 
      location: RestrictedArea.CUBA,
      boundary: {
        type: "Polygon",
        coordinates: [[
          [-85.3, 19.4],
          [-73.8, 19.4],
          [-73.8, 23.7],
          [-85.3, 23.7],
          [-85.3, 19.4],
        ]]
      } 
    },
    {
      location: RestrictedArea.IRAN,
      boundary: {
        type: "Polygon",
        coordinates: [[
          [43.0, 24.0],
          [63.5, 24.0],
          [63.5, 40.5],
          [43.0, 40.5],
          [43.0, 24.0],
        ]]
      }
    }
  ] as unknown as ISanctionedRegion[];

  const sellers: ISeller[] = [
    {
      seller_id: "0a0a0a-0a0a-0a0a",
      name: "Test Seller 1",
      address: "Not Sanctioned Region",
      seller_type: SellerType.Restricted,
      pre_restriction_seller_type: SellerType.Active,
      isPreRestricted: true,
      sell_map_center: { type: "Point", coordinates: [-74.0060, 40.7128] }
    },
    {
      seller_id: "0b0b0b-0b0b-0b0b",
      name: "Test Vendor 2",
      address: "Not Sanctioned Region",
      seller_type: SellerType.Active,
      pre_restriction_seller_type: null,
      isPreRestricted: true,
      sell_map_center: { type: "Point", coordinates: [-118.2437, 34.0522] }
    },
    {
      seller_id: "0f0f0f-0f0f-0f0f",
      name: "Test Seller Sanctioned 6",
      address: "Sanctioned Region Cuba",
      seller_type: SellerType.Active,
      pre_restriction_seller_type: null,
      isPreRestricted: true,
      sell_map_center: { type: "Point", coordinates: [-84.3829, 22.132] }
    },
    {
      seller_id: "0g0g0g-0g0g-0g0g",
      name: "Test Seller Sanctioned 7",
      address: "Sanctioned Region Iran",
      seller_type: SellerType.Test,
      pre_restriction_seller_type: null,
      isPreRestricted: true,
      sell_map_center: { type: "Point", coordinates: [46.7324, 37.4585] }
    }
  ] as unknown as ISeller[];

  const mockedSeller = Seller as jest.Mocked<typeof Seller>;
  const mockedGetAllSanctionedRegions = getAllSanctionedRegions as jest.Mock;
  const mockedCreateBulkPreRestrictionOperation = createBulkPreRestrictionOperation as jest.Mock;
  const mockedCreateGeoQueries = createGeoQueries as jest.Mock;
  const mockedGetSellersToEvaluate = getSellersToEvaluate as jest.Mock;
  const mockedProcessSellersGeocoding = processSellersGeocoding as jest.Mock;
  const mockedProcessSanctionedSellers = processSanctionedSellers as jest.Mock;
  const mockedProcessUnsanctionedSellers = processUnsanctionedSellers as jest.Mock;

  it("should exit early if no sanctioned regions are found", async () => {
    mockedSeller.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acknowledged: true }),
    } as any);
  
    mockedSeller.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    } as any);
    
    mockedGetAllSanctionedRegions.mockResolvedValue([]);

    await runSanctionBot();

    expect(mockedSeller.updateMany).toHaveBeenCalledWith({}, { isPreRestricted: false });
    expect(mockedGetAllSanctionedRegions).toHaveBeenCalled();
    expect(mockedCreateGeoQueries).not.toHaveBeenCalled();
    expect(mockedGetSellersToEvaluate).not.toHaveBeenCalled();
    expect(mockedCreateBulkPreRestrictionOperation).not.toHaveBeenCalled();
    expect(mockedSeller.bulkWrite).not.toHaveBeenCalled();
    expect(mockedSeller.find).not.toHaveBeenCalled();
    expect(mockedProcessSellersGeocoding).not.toHaveBeenCalled();
    expect(mockedProcessSanctionedSellers).not.toHaveBeenCalled();
    expect(mockedProcessUnsanctionedSellers).not.toHaveBeenCalled();
    // Final cleanup step and assertion
    expect(mockedSeller.updateMany).toHaveBeenCalledTimes(1);
  });

  it("should process completely when sanctioned regions are found and sellers are evaluated", async () => {
    const expectedGeoQueries = sanctionedRegions.map(region => ({
      sell_map_center: {
        $geoWithin: {
          $geometry: region.boundary
        }
      }
    }));

    const expectedBulkPreRestrictionOps = [
      {
        updateOne: {
          filter: { seller_id: "0a0a0a-0a0a-0a0a" },
          update: {
            $set: {
              seller_type: SellerType.Restricted,
              pre_restriction_seller_type: SellerType.Active
            }
          }
        }
      },
      {
        updateOne: {
          filter: { seller_id: "0b0b0b-0b0b-0b0b" },
          update: {
            $set: {
              seller_type: SellerType.Active,
              pre_restriction_seller_type: null
            }
          }
        }
      },
      {
        updateOne: {
          filter: { seller_id: "0f0f0f-0f0f-0f0f" },
          update: {
            $set: {
              seller_type: SellerType.Active,
              pre_restriction_seller_type: null
            }
          }
        }
      },
      {
        updateOne: {
          filter: { seller_id: "0g0g0g-0g0g-0g0g" },
          update: {
            $set: {
              seller_type: SellerType.Test,
              pre_restriction_seller_type: null
            }
          }
        }
      }
    ];

    const expectedSanctionedSellerStatuses: SanctionedSellerStatus[] = [
      {
        seller_id: "0a0a0a-0a0a-0a0a",
        pre_restriction_seller_type: SellerType.Active,
        isSanctionedRegion: false
      },
      {
        seller_id: "0b0b0b-0b0b-0b0b",
        pre_restriction_seller_type: SellerType.Active,
        isSanctionedRegion: false
      },
      {
        seller_id: "0f0f0f-0f0f-0f0f",
        pre_restriction_seller_type: SellerType.Active,
        isSanctionedRegion: true
      },
      {
        seller_id: "0g0g0g-0g0g-0g0g",
        pre_restriction_seller_type: SellerType.Test,
        isSanctionedRegion: true
      }
    ] as unknown as SanctionedSellerStatus[];

    mockedSeller.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acknowledged: true }),
    } as any);
  
    mockedSeller.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(sellers),
    } as any);

    mockedGetAllSanctionedRegions.mockResolvedValue(sanctionedRegions);
    mockedCreateGeoQueries.mockReturnValue(expectedGeoQueries);
    mockedGetSellersToEvaluate.mockResolvedValue(sellers);
    mockedCreateBulkPreRestrictionOperation.mockResolvedValue(expectedBulkPreRestrictionOps);
    mockedProcessSellersGeocoding.mockResolvedValue(expectedSanctionedSellerStatuses);

    await runSanctionBot();

    expect(mockedGetAllSanctionedRegions).toHaveBeenCalled();
    expect(mockedCreateGeoQueries).toHaveBeenCalledWith(sanctionedRegions);
    expect(mockedGetSellersToEvaluate).toHaveBeenCalledWith(expectedGeoQueries);
    expect(mockedCreateBulkPreRestrictionOperation).toHaveBeenCalledWith(sellers);
    expect(mockedProcessSellersGeocoding).toHaveBeenCalledWith(sellers, sanctionedRegions); 
    
    const sanctionedSellers = expectedSanctionedSellerStatuses.filter(s => s.isSanctionedRegion);
    const unsanctionedSellers = expectedSanctionedSellerStatuses.filter(s => !s.isSanctionedRegion);
    expect(mockedProcessSanctionedSellers).toHaveBeenCalledWith(sanctionedSellers);
    expect(mockedProcessUnsanctionedSellers).toHaveBeenCalledWith(unsanctionedSellers);
    
    expect(mockedSeller.updateMany).toHaveBeenCalledWith({isPreRestricted: true}, {isPreRestricted: false});
  });
});
