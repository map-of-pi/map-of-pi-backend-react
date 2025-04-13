import { runSanctionBot } from "../../../src/cron/jobs/sanctionBot.job";
import * as geoUtils from "../../../src/cron/utils/geoUtils";
import Seller from "../../../src/models/Seller";
import { SellerType } from "../../../src/models/enums/sellerType";
import { getAllSanctionedRegions, processSellerGeocoding } from "../../../src/services/admin/report.service";

jest.mock("../../../src/models/Seller");
jest.mock("../../../src/services/admin/report.service", () => ({
  getAllSanctionedRegions: jest.fn(),
  processSellerGeocoding: jest.fn(),
}));

describe("runSanctionBot function", () => {
  const mockedSeller = Seller as jest.Mocked<typeof Seller>;
  const mockedGetAllSanctionedRegions = getAllSanctionedRegions as jest.Mock;
  const mockedProcessSellerGeocoding = processSellerGeocoding as jest.Mock;
  
  const updateManySpy = jest.spyOn(Seller, "updateMany")
    .mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acknowledged: true }),
    } as any);
  const bulkWriteSpy = jest.spyOn(Seller, "bulkWrite");
  const findSpy = jest.spyOn(Seller, "find");
  const findOneSpy = jest.spyOn(Seller, "findOne");

  const createBulkPreRestrictionOperationSpy = jest.spyOn(geoUtils, "createBulkPreRestrictionOperation");
  const createGeoQueriesSpy = jest.spyOn(geoUtils, "createGeoQueries");
  
  beforeEach(() => {
    jest.clearAllMocks();

    mockedSeller.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acknowledged: true }),
    } as any);

    mockedSeller.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    } as any);
  });

  it("should exit early if no sanctioned regions are found", async () => {
    mockedGetAllSanctionedRegions.mockResolvedValue([]);

    await runSanctionBot();

    expect(mockedGetAllSanctionedRegions).toHaveBeenCalled();
    expect(createGeoQueriesSpy).not.toHaveBeenCalled();
  });

  it("should reset all sellers and not apply restriction if none are in pre-defined sanctioned regions", async () => {
    mockedGetAllSanctionedRegions.mockResolvedValue([
      {
        boundary: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
        },
        location: { country: "Mock Sanctioned Region" },
      },
    ]);

    await runSanctionBot();

    expect(mockedSeller.updateMany).toHaveBeenCalled();
    expect(mockedSeller.find).toHaveBeenCalledWith({ $or: expect.any(Array) });
  });

  it("should set pre_restriction_seller_type if seller_type is not already 'Restricted'", async () => {
    const seller = {
      seller_id: "0a0a0a-0a0a-0a0a",
      seller_type: SellerType.Active,
      pre_restriction_seller_type: undefined,
      isPreRestricted: false,
    }
    
    mockedGetAllSanctionedRegions.mockResolvedValue([
      {
        boundary: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
        },
        location: { country: "Mock Sanctioned Region" },
      },
    ]);

    mockedProcessSellerGeocoding.mockResolvedValue([
      {
        ...seller,
        isPreRestricted: true,
      },
    ]);

    // First Seller.find() — for sellers in geo region
    mockedSeller.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([seller]),
      } as any)
      // Second Seller.find() — for Pre-Restricted sellers
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            ...seller,
            isPreRestricted: true,
          }
        ]),  
      } as any);

    mockedSeller.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...seller,
        isPreRestricted: true,
        pre_restriction_seller_type: SellerType.Active,
      }),
    } as any);

    mockedSeller.bulkWrite.mockResolvedValue({} as any);

    // Invoke the implementation function
    await runSanctionBot();

    // Ensures sellers are reset before we apply new restrictions
    expect(updateManySpy).toHaveBeenCalledWith({}, { isPreRestricted: false });

    // Capture and inspect bulkWrite calls
    const allCalls = bulkWriteSpy.mock.calls;
    expect(allCalls.length).toBe(2);

    // Get the first bulkWrite call's argument
    const firstCallArgs = allCalls[0][0];
    expect(firstCallArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            update: expect.objectContaining({
              $set: expect.objectContaining({
                isPreRestricted: true,
                pre_restriction_seller_type: SellerType.Active,
              }),
            }),
          }),
        }),
      ])
    );
    
    // Get the second bulkWrite call's argument
    const secondCallArgs = allCalls[1][0];
    expect(secondCallArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            update: expect.objectContaining({
              $set: {
                seller_type: SellerType.Restricted,
              },
              $setOnInsert: {
                pre_restriction_seller_type: SellerType.Active,
              },
            }),
          }),
        }),
      ])
    );
  });

  it("should not overwrite pre_restriction_seller_type if seller_type is already 'Restricted'", async () => {
    const seller = {
      seller_id: "0b0b0b-0b0b-0b0b",
      seller_type: SellerType.Restricted,
      pre_restriction_seller_type: SellerType.Active,
      isPreRestricted: false,
    }

    mockedGetAllSanctionedRegions.mockResolvedValue([
      {
        boundary: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
        },
        location: { country: "Mock Sanctioned Region" },
      },
    ]);

    mockedProcessSellerGeocoding.mockResolvedValue([
      {
        ...seller,
        isPreRestricted: true,
      },
    ]);

    // First Seller.find() — for sellers in geo region
    mockedSeller.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([seller]),
      } as any)
      // Second Seller.find() — for Pre-Restricted sellers
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            ...seller,
            isPreRestricted: true,
          }
        ]),  
      } as any);

    mockedSeller.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...seller,
        isPreRestricted: true,
        pre_restriction_seller_type: SellerType.Active,
      }),
    } as any);

    mockedSeller.bulkWrite.mockResolvedValue({} as any);

    // Invoke the implementation function
    await runSanctionBot();

    // Ensures sellers are reset before we apply new restrictions
    expect(updateManySpy).toHaveBeenCalledWith({}, { isPreRestricted: false });

    // Capture and inspect bulkWrite calls
    const allCalls = bulkWriteSpy.mock.calls;
    expect(allCalls.length).toBe(2);

    // Get the first bulkWrite call's argument
    const firstCallArgs = allCalls[0][0];
    expect(firstCallArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            update: expect.objectContaining({
              $set: expect.objectContaining({
                isPreRestricted: true,
              }),
            }),
          }),
        }),
      ])
    );

    // Get the second bulkWrite call's argument
    const secondCallArgs = allCalls[1][0];
    expect(secondCallArgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            update: expect.objectContaining({
              $set: {
                seller_type: SellerType.Restricted,
              },
              $setOnInsert: {
                // Should remain Active as the seller is already restricted
                pre_restriction_seller_type: SellerType.Active,
              },
            }),
          }),
        }),
      ])
    );
  });

  it('should not proceed with updates if getAllSanctionedRegions call fails', async () => {
    // Mock failure for getAllSanctionedRegions
    mockedGetAllSanctionedRegions.mockRejectedValueOnce(
      new Error("Failed to get sanctioned regions; please try again later")
    );

    // Invoke the implementation function
    await runSanctionBot();

    expect(updateManySpy).toHaveBeenCalledWith({}, { isPreRestricted: false });
    expect(mockedGetAllSanctionedRegions).toHaveBeenCalled();
    expect(createGeoQueriesSpy).not.toHaveBeenCalled();
    expect(findSpy).not.toHaveBeenCalled();
    expect(findOneSpy).not.toHaveBeenCalled();
    expect(createBulkPreRestrictionOperationSpy).not.toHaveBeenCalled();
    expect(bulkWriteSpy).not.toHaveBeenCalled();
  });

  it('should not proceed with updates if processSellerGeocoding call fails', async () => {
    const seller = {
      seller_id: "0c0c0c-0c0c-0c0c",
      seller_type: SellerType.Test,
      pre_restriction_seller_type: undefined,
      isPreRestricted: false,
    }

    mockedGetAllSanctionedRegions.mockResolvedValue([
      {
        boundary: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
        },
        location: { country: "Mock Sanctioned Region" },
      },
    ]);

    // First Seller.find() — for sellers in geo region
    mockedSeller.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([seller]),
      } as any)
      // Second Seller.find() — for Pre-Restricted sellers
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            ...seller,
            isPreRestricted: true,
          }
        ]),  
      } as any);

    // Mock failure for processSellerGeocoding
    mockedProcessSellerGeocoding.mockRejectedValueOnce(
      new Error("Failed to process seller geocoding; please try again later")
    );

    // Invoke the implementation function
    await runSanctionBot();

    expect(updateManySpy).toHaveBeenCalledWith({}, { isPreRestricted: false });
    expect(mockedGetAllSanctionedRegions).toHaveBeenCalled();
    expect(findOneSpy).not.toHaveBeenCalled();

    const allFindCalls = findSpy.mock.calls;
    expect(allFindCalls.length).toBe(2);

    const allBulkWriteCalls = bulkWriteSpy.mock.calls;
    expect(allBulkWriteCalls.length).toBe(1);
  });
});