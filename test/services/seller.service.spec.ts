import { getAllSellers } from '../../src/services/seller.service';
import Seller from '../../src/models/Seller';
import { SellerType } from '../../src/models/enums/sellerType';

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