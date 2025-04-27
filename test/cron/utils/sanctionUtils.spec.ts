import { 
  getSellersToEvaluate,
  processSellersGeocoding,
  processSanctionedSellers,
  processUnsanctionedSellers
} from "../../../src/cron/utils/sanctionUtils";
import { processSellerGeocoding } from "../../../src/services/admin/report.service";
import Seller from "../../../src/models/Seller";
import { SellerType } from "../../../src/models/enums/sellerType";
import { ISanctionedRegion, ISeller, SanctionedSellerStatus } from "../../../src/types";
import { RestrictedArea } from "../../../src/models/enums/restrictedArea";

jest.mock("../../../src/models/Seller");
jest.mock("../../../src/services/admin/report.service");

describe("getSellersToEvaluate function", () => {
  const mockedSeller = Seller as jest.Mocked<typeof Seller>;

  it("should return sellers matching geoQueries that are within sanctioned zones", async () => {
    const mockSellers = [
      { 
        seller_id: "0a0a0a-0a0a-0a0a",
        sell_map_center: {
          type: "Point",
          coordinates: [0, 0]
        },
      }
    ];
    
    const mockGeoQuery = [{
       sell_map_center: {
         $geoWithin: {
           $geometry: {
             type: "Polygon", coordinates: [[[0, 0]]] 
            }
          }
        }
      }
    ];

    const expectedQuery = {
      $or: [
        ...mockGeoQuery,
        { seller_type: SellerType.Restricted }
      ]
    };

    const execMock = jest.fn().mockResolvedValue(mockSellers);
    mockedSeller.find.mockReturnValueOnce({ exec: execMock } as any);

    const result = await getSellersToEvaluate(mockGeoQuery as any);

    expect(Seller.find).toHaveBeenCalledWith(expectedQuery);
    expect(execMock).toHaveBeenCalled();
    expect(result).toEqual(mockSellers);
  });

  it("should return sellers already marked as Restricted", async () => {
    const mockSellers = [
      { 
        seller_id: "0b0b0b-0b0b-0b0b",
        seller_type: SellerType.Restricted
      }
    ];

    const mockGeoQuery: any[] = [];
    const expectedQuery = {
      $or: [
        ...mockGeoQuery,
        { seller_type: SellerType.Restricted }
      ]
    };

    const execMock = jest.fn().mockResolvedValue(mockSellers);
    mockedSeller.find.mockReturnValueOnce({ exec: execMock } as any);

    const result = await getSellersToEvaluate(mockGeoQuery);

    expect(Seller.find).toHaveBeenCalledWith(expectedQuery);
    expect(execMock).toHaveBeenCalled();
    expect(result).toEqual(mockSellers);
  });

  it("should return an empty array if no sellers match", async () => {
    const mockGeoQuery: any[] = [];
    const expectedQuery = {
      $or: [
        ...mockGeoQuery,
        { seller_type: SellerType.Restricted }
      ]
    };
    
    mockedSeller.find.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([]) } as any);
  
    const result = await getSellersToEvaluate([]);

    expect(Seller.find).toHaveBeenCalledWith(expectedQuery);
    expect(result).toEqual([]);
  });
});

describe("processSellersGeocoding function", () => {
  const mockedProcessSellerGeocoding = processSellerGeocoding as jest.MockedFunction<typeof processSellerGeocoding>;

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
  
  it("should flag sellers if their location matches a sanctioned region", async () => {
    const sellers: ISeller[] = [
      {
        seller_id: "0f0f0f-0f0f-0f0f",
        name: "Test Seller Sanctioned 6",
        address: "Sanctioned Region Cuba",
        seller_type: SellerType.Active,
        pre_restriction_seller_type: null,
        sell_map_center: { type: "Point", coordinates: [-84.3829, 22.132] }
      },
      {
        seller_id: "0g0g0g-0g0g-0g0g",
        name: "Test Seller Sanctioned 7",
        address: "Sanctioned Region Iran",
        seller_type: SellerType.Test,
        pre_restriction_seller_type: null,
        sell_map_center: { type: "Point", coordinates: [46.7324, 37.4585] }
      }
    ] as unknown as ISeller[];
  
    mockedProcessSellerGeocoding.mockImplementation(async (seller, region) => {
      if (
        (seller.seller_id === "0f0f0f-0f0f-0f0f" && region === RestrictedArea.CUBA) ||
        (seller.seller_id === "0g0g0g-0g0g-0g0g" && region === RestrictedArea.IRAN)
      ) {
        return {
          seller_id: seller.seller_id,
          name: seller.name,
          address: seller.address,
          sell_map_center: seller.sell_map_center,
          sanctioned_location: region,
          pre_restriction_seller_type: seller.pre_restriction_seller_type
        };
      }
      return null;
    });

    const result = await processSellersGeocoding(sellers, sanctionedRegions);

    expect(mockedProcessSellerGeocoding).toHaveBeenCalled();
    expect(result).toEqual([
      {
        seller_id: "0f0f0f-0f0f-0f0f",
        pre_restriction_seller_type: null,
        isSanctionedRegion: true
      },
      {
        seller_id: "0g0g0g-0g0g-0g0g",
        pre_restriction_seller_type: null,
        isSanctionedRegion: true
      }
    ]);
  });

  it("should not flag sellers if their location does not match a sanctioned region", async () => {
    const sellers: ISeller[] = [
      {
        seller_id: "0a0a0a-0a0a-0a0a",
        name: "Test Seller 1",
        address: "Not Sanctioned Region",
        seller_type: SellerType.Restricted,
        pre_restriction_seller_type: SellerType.Active,
        sell_map_center: { type: "Point", coordinates: [-74.0060, 40.7128] }
      },
      {
        seller_id: "0b0b0b-0b0b-0b0b",
        name: "Test Vendor 2",
        address: "Not Sanctioned Region",
        seller_type: SellerType.Active,
        pre_restriction_seller_type: null,
        sell_map_center: { type: "Point", coordinates: [-118.2437, 34.0522] }
      }
    ] as unknown as ISeller[];
  
    mockedProcessSellerGeocoding.mockResolvedValue(null);

    const result = await processSellersGeocoding(sellers, sanctionedRegions);

    expect(mockedProcessSellerGeocoding).toHaveBeenCalledTimes(sellers.length * sanctionedRegions.length);
    expect(result).toEqual([
      {
        seller_id: "0a0a0a-0a0a-0a0a",
        pre_restriction_seller_type: SellerType.Active,
        isSanctionedRegion: false
      },
      {
        seller_id: "0b0b0b-0b0b-0b0b",
        pre_restriction_seller_type: null,
        isSanctionedRegion: false
      }
    ]);
  });

  it("should return an empty array if no sellers are provided", async () => {
    const result = await processSellersGeocoding([], sanctionedRegions);
    expect(result).toEqual([]);
    expect(mockedProcessSellerGeocoding).not.toHaveBeenCalled();
  });
});

describe("processSanctionedSellers function", () => {
  let mockedBulkWrite: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedBulkWrite = jest.fn().mockResolvedValue({});
    (Seller.bulkWrite as jest.Mock) = mockedBulkWrite;
  });

  it("Sets seller_type to Restricted and preserves pre_restriction_seller_type for sanctioned sellers", async () => {
    const sanctionedSellers: SanctionedSellerStatus[] = [
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

    await processSanctionedSellers(sanctionedSellers);

    expect(mockedBulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { seller_id: "0f0f0f-0f0f-0f0f" },
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
          filter: { seller_id: "0g0g0g-0g0g-0g0g" },
          update: {
            $set: {
              seller_type: SellerType.Restricted,
              pre_restriction_seller_type: SellerType.Test
            }
          }
        }
      }
    ]);
  });

  it("Does not call bulkWrite when there are no sanctioned sellers", async () => {
    await processSanctionedSellers([]);

    expect(Seller.bulkWrite).not.toHaveBeenCalled();
  });
});

describe("processUnsanctionedSellers function", () => {
  let mockedBulkWrite: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedBulkWrite = jest.fn().mockResolvedValue({});
    (Seller.bulkWrite as jest.Mock) = mockedBulkWrite;
  });

  it("Restores seller_type and defaults pre_restriction_seller_type field for unsanctioned sellers", async () => {
    const unsanctionedSellers: SanctionedSellerStatus[] = [
      {
        seller_id: "0a0a0a-0a0a-0a0a",
        pre_restriction_seller_type: SellerType.Active,
        isSanctionedRegion: false
      },
      {
        seller_id: "0b0b0b-0b0b-0b0b",
        pre_restriction_seller_type: SellerType.Test,
        isSanctionedRegion: false
      }
    ] as unknown as SanctionedSellerStatus[];

    await processUnsanctionedSellers(unsanctionedSellers);

    expect(mockedBulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { seller_id: "0a0a0a-0a0a-0a0a" },
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
          filter: { seller_id: "0b0b0b-0b0b-0b0b" },
          update: {
            $set: {
              seller_type: SellerType.Test,
              pre_restriction_seller_type: null
            }
          }
        }
      }
    ]);
  });

  it("Does not call bulkWrite when there are no unsanctioned sellers", async () => {
    await processUnsanctionedSellers([]);

    expect(Seller.bulkWrite).not.toHaveBeenCalled();
  });
});
