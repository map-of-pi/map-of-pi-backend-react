import Seller from '../../src/models/Seller';
import SellerItem from '../../src/models/SellerItem';
import { 
  getAllSellers,
  getAllSellerItems, 
  addOrUpdateSellerItem,
  deleteSellerItem,
  getSellersWithinSanctionedRegion 
} from '../../src/services/seller.service';
import { SellerType } from '../../src/models/enums/sellerType';
import { RestrictedArea, RestrictedAreaBoundaries } from '../../src/models/enums/restrictedArea';
import { ISanctionedRegion, ISeller, ISellerItem } from '../../src/types';

describe('getAllSellers function', () => {
  const mockBoundingBox = {
    sw_lat: 40.7000,
    sw_lng: -74.0060,
    ne_lat: 40.9000,
    ne_lng: -73.8000
  };

  it('should fetch all sellers when all parameters are empty', async () => {
    const sellersData = await getAllSellers();

    expect(sellersData).toHaveLength(await Seller.countDocuments({
      seller_type: { $ne: SellerType.Inactive }
    }));
  });

  it('should fetch all applicable sellers when search query is provided and bounding box params are empty', async () => {
    const searchQuery = 'Vendor';
    
    const sellersData = await getAllSellers(undefined, searchQuery);
    
    /* filter seller records to include those with "Vendor" 
       + exclude those with seller_type "Inactive" */
    expect(sellersData).toHaveLength(
      await Seller.countDocuments({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ],
        seller_type: { $ne: SellerType.Inactive }
      })
    ); // Ensure length matches expected sellers
  });

  it('should fetch all applicable sellers when bounding box params are provided and search query param is empty', async () => {
    const sellersData = await getAllSellers(mockBoundingBox, undefined);
    
    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with sell_map_center within geospatial bounding box */
    expect(sellersData).toHaveLength(
      await Seller.countDocuments({
        seller_type: { $ne: SellerType.Inactive },
        'sell_map_center.coordinates': {
          $geoWithin: {
            $box: [
              [mockBoundingBox.sw_lng, mockBoundingBox.sw_lat],
              [mockBoundingBox.ne_lng, mockBoundingBox.ne_lat]
            ]
          },
        },
      })
    ); // Ensure length matches expected sellers
  });

  it('should fetch all applicable sellers when all parameters are provided', async () => {
    const searchQuery = 'Vendor';

    const sellersData = await getAllSellers(mockBoundingBox, 'Vendor');

    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with "Vendor"
       + include those with sell_map_center within geospatial bounding box */
    expect(sellersData).toHaveLength(
      await Seller.countDocuments({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ],
        seller_type: { $ne: SellerType.Inactive },
        'sell_map_center.coordinates': {
          $geoWithin: {
            $box: [
              [mockBoundingBox.sw_lng, mockBoundingBox.sw_lat],
              [mockBoundingBox.ne_lng, mockBoundingBox.ne_lat]
            ]
          },
        },
      })
    ); // Ensure length matches expected sellers
  });
});

describe('getAllSellerItems function', () => {
  it('should return all existing seller items associated with the seller', async () => {  
    const sellerItemsData = await getAllSellerItems('0a0a0a-0a0a-0a0a');

    // filter and assert seller item records associated with the seller
    expect(sellerItemsData).toHaveLength(
      await SellerItem.countDocuments({ seller_id: '0a0a0a-0a0a-0a0a' })
    );
  });

  it('should return null when no seller items exist for the seller', async () => {
    const sellerItemsData = await getAllSellerItems('0c0c0c-0c0c-0c0c');
    
    expect(sellerItemsData).toBeNull();
  });

  it('should throw an error when an exception occurs', async () => {
    jest.spyOn(SellerItem, 'find').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });

    await expect(getAllSellerItems('0b0b0b-0b0b-0b0b')).rejects.toThrow(
      'Failed to get seller items; please try again later'
    );
  });
});

describe('addOrUpdateSellerItem function', () => {
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToPlainObject = (sellerItem: ISellerItem): any => {
    const plainObject = sellerItem.toObject();

    if (plainObject.price) {
      plainObject.price = Number(plainObject.price);
    }
    
    if (plainObject.created_at) {
      plainObject.created_at = new Date(plainObject.created_at);
      plainObject.created_at.setHours(0, 0, 0, 0);
    }

    if (plainObject.updated_at) {
      plainObject.updated_at = new Date(plainObject.updated_at);
      plainObject.updated_at.setHours(0, 0, 0, 0);
    }

    if (plainObject.expired_by) {
      plainObject.expired_by = new Date(plainObject.expired_by);
      plainObject.expired_by.setHours(0, 0, 0, 0);
    }
    return plainObject;
  };

  const assertNewSellerItem = (actual: any, expected: any) => {
    const { _id, __v, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  const assertUpdatedSellerItem = (actual: any, expected: any) => {
    const { __v, created_at, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining({ ...expected, _id: actual._id }));
  };

  it('should build new seller item if it does not exist for the seller', async () => {    
    const sellerItem = {
      seller_id: "0c0c0c-0c0c-0c0c",
      name: 'Test Seller 3 Item 1',
      description: "Test Seller 3 Item 1 Description",
      price: 0.50,
      stock_level: "Many available",
      duration: 2,
      image: 'http://example.com/testSellerThreeItemOne.jpg'
    } as unknown as ISellerItem;

    const sellerItemData = (await addOrUpdateSellerItem(
      { seller_id: "0c0c0c-0c0c-0c0c" } as ISeller, sellerItem)) as ISellerItem;

    // Convert `sellerItemData` to a plain object if it's a Mongoose document
    const plainObject = await convertToPlainObject(sellerItemData);

    const current_date = new Date();
    current_date.setHours(0, 0, 0, 0);

    // Calculate the expired_by date (current_date + duration in weeks)
    const durationInMs = (sellerItem.duration || 1) * 7 * 24 * 60 * 60 * 1000;
    const expired_date = new Date(current_date.getTime() + durationInMs)
    expired_date.setHours(0, 0, 0, 0);

    // filter and assert seller item records associated with the seller
    assertNewSellerItem(plainObject, {
      seller_id: sellerItem.seller_id,
      name: sellerItem.name,
      description: sellerItem.description,
      price: sellerItem.price,
      stock_level: sellerItem.stock_level,
      duration: sellerItem.duration,
      image: sellerItem.image,
      created_at: current_date,
      updated_at: current_date,
      expired_by: expired_date
    });
  });

  it('should update existing seller item if it does exist for the seller', async () => {  
    const sellerItem = {
      _id: "25f5a0f2a86d1f9f3b7e4e81",
      seller_id: "0b0b0b-0b0b-0b0b",
      name: 'Test Seller 2 Item 1 Updated',
      description: "Test Seller 2 Item 1 Description Updated",
      price: 0.50,
      stock_level: "Sold",
      duration: 2,
      image: 'http://example.com/testSellerThreeItemOneUpdated.jpg'
    } as unknown as ISellerItem;

    const sellerItemData = (
      await addOrUpdateSellerItem(
        { seller_id: "0b0b0b-0b0b-0b0b" } as ISeller, sellerItem)) as ISellerItem;

    // Convert `sellerItemData` to a plain object if it's a Mongoose document
    const plainObject = await convertToPlainObject(sellerItemData);

    const current_date = new Date();
    current_date.setHours(0, 0, 0, 0);

    // Calculate the expired_by date (current_date + duration in weeks)
    const durationInMs = (sellerItem.duration || 1) * 7 * 24 * 60 * 60 * 1000;
    const expired_date = new Date(current_date.getTime() + durationInMs)
    expired_date.setHours(0, 0, 0, 0);

    // filter and assert seller item records associated with the seller
    assertUpdatedSellerItem(plainObject, {
      _id: sellerItem._id,
      seller_id: sellerItem.seller_id,
      name: sellerItem.name,
      description: sellerItem.description,
      price: sellerItem.price,
      stock_level: sellerItem.stock_level,
      duration: sellerItem.duration,
      image: sellerItem.image,
      updated_at: current_date,
      expired_by: expired_date
    });
  });

  it('should throw an error when an exception occurs', async () => {  
    const sellerItem = {
      _id: "25f5a0f2a86d1f9f3b7e4e81",
      seller_id: "0b0b0b-0b0b-0b0b",
      name: 'Test Seller 2 Item 1 Updated',
      description: "Test Seller 2 Item 1 Description Updated",
      price: 0.50,
      stock_level: "Ongoing service",
      duration: 2,
      image: 'http://example.com/testSellerThreeItemOneUpdated.jpg'
    } as unknown as ISellerItem;

    // Mock the SellerItem model to throw an error
    jest.spyOn(SellerItem, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });

    await expect(addOrUpdateSellerItem({ seller_id: "0b0b0b-0b0b-0b0b" } as ISeller, sellerItem)).rejects.toThrow(
      'Failed to add or update seller item; please try again later'
    );
  });
});

describe('deleteSellerItem function', () => {
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToPlainObject = (sellerItem: ISellerItem): any => {
    const plainObject = sellerItem.toObject();

    if (plainObject.price) {
      plainObject.price = Number(plainObject.price);
    }

    // Normalize timestamps
    if (plainObject.created_at instanceof Date) {
      plainObject.created_at = plainObject.created_at.toISOString();
    }
    if (plainObject.updated_at instanceof Date) {
      plainObject.updated_at = plainObject.updated_at.toISOString();
    }
    if (plainObject.expired_by instanceof Date) {
      plainObject.expired_by = plainObject.expired_by.toISOString();
    }
    
    return plainObject;
  };

  const assertDeletedSellerItem = (actual: any, expected: any) => {
    const { __v, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining({ ...expected, _id: actual._id }));
  };

  it('should delete seller item if it does exist for the seller', async () => {
    const sellerItem = {
      _id: "25f5a0f2a86d1f9f3b7e4e82",
      seller_id: "0b0b0b-0b0b-0b0b",
      name: 'Test Seller 2 Item 2',
      description: "Test Seller 2 Item 2 Description",
      price: 0.25,
      stock_level: "Ongoing service",
      duration: 1,
      image: 'http://example.com/testSellerTwoItemTwo.jpg',
      created_at: '2025-01-10T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
      expired_by: '2025-01-17T00:00:00.000Z'
    } as unknown as ISellerItem;

    const sellerItemData = await deleteSellerItem(sellerItem._id) as ISellerItem;

    // Convert `sellerItemData` to a plain object if it's a Mongoose document
    const plainObject = await convertToPlainObject(sellerItemData);
    
    // filter and assert seller item records associated with the seller
    assertDeletedSellerItem(plainObject, {
      _id: sellerItem._id,
      seller_id: sellerItem.seller_id,
      name: sellerItem.name,
      description: sellerItem.description,
      price: sellerItem.price,
      stock_level: sellerItem.stock_level,
      duration: sellerItem.duration,
      image: sellerItem.image,
      created_at: sellerItem.created_at,
      updated_at: sellerItem.updated_at,
      expired_by: sellerItem.expired_by
    });
  });

  it('should throw an error when an exception occurs', async () => {  
    const sellerItem = { _id: "25f5a0f2a86d1f9f3b7e4e82" } as unknown as ISellerItem;

    // Mock the SellerItem model to throw an error
    jest.spyOn(SellerItem, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error('Unexpected exception occurred');
    });

    await expect(deleteSellerItem(sellerItem._id)).rejects.toThrow(
      'Failed to delete seller item; please try again later'
    );
  });
});

describe('getSellersWithinSanctionedRegion function', () => {
  it('should fetch all sellers within a sanctioned region in Cuba', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.CUBA,
      boundary: RestrictedAreaBoundaries[RestrictedArea.CUBA]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in Iran', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.IRAN,
      boundary: RestrictedAreaBoundaries[RestrictedArea.IRAN]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in North Korea', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.NORTH_KOREA,
      boundary: RestrictedAreaBoundaries[RestrictedArea.NORTH_KOREA]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in Syria', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.SYRIA,
      boundary: RestrictedAreaBoundaries[RestrictedArea.SYRIA]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in Republic of Crimea', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.REPUBLIC_OF_CRIMEA,
      boundary: RestrictedAreaBoundaries[RestrictedArea.REPUBLIC_OF_CRIMEA]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in Donetsk Oblast', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.DONETSK_OBLAST,
      boundary: RestrictedAreaBoundaries[RestrictedArea.DONETSK_OBLAST]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);

    expect(sellersData).toHaveLength(1);
  });

  it('should fetch all sellers within a sanctioned region in Luhansk Oblast', async () => {
    const sanctionedRegion = {
      location: RestrictedArea.LUHANSK_OBLAST,
      boundary: RestrictedAreaBoundaries[RestrictedArea.LUHANSK_OBLAST]
    } as ISanctionedRegion;
    
    const sellersData = await getSellersWithinSanctionedRegion(sanctionedRegion);
    // potential seller location overlap with boundaries between Donetsk Oblast and Luhansk Oblast.
    expect(sellersData).toHaveLength(1);
  });
});
