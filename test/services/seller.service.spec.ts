import Seller from '../../src/models/Seller';
import { getAllSellers, getSellersWithinSanctionedRegion } from '../../src/services/seller.service';
import { SellerType } from '../../src/models/enums/sellerType';
import { RestrictedArea, RestrictedAreaBoundaries } from '../../src/models/enums/restrictedArea';
import { ISanctionedRegion } from '../../src/types';

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