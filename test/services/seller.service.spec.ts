import { getAllSellers } from '../../src/services/seller.service';
import Seller from '../../src/models/Seller';
import { SellerType } from '../../src/models/enums/sellerType';

describe('getAllSellers function', () => {
  it('should fetch all sellers when all parameters are empty', async () => {
    const result = await getAllSellers();

    expect(result).toHaveLength(await Seller.countDocuments({
      seller_type: { $ne: SellerType.Inactive }
    }));
  });

  it('should fetch all applicable sellers when search query is provided and origin + radius params are empty', async () => {  
    const searchQuery = 'Vendor';
    
    const result = await getAllSellers(undefined, undefined, searchQuery);
    
    /* filter seller records to include those with "Vendor" 
       + exclude those with seller_type "Inactive" */
    expect(result).toHaveLength(
      await Seller.countDocuments({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { sale_items: { $regex: searchQuery, $options: 'i' } },
        ],
        seller_type: { $ne: SellerType.Inactive }
      })
    ); // Ensure length matches expected sellers
  });

  it('should fetch all applicable sellers when origin + radius are provided and search query param is empty', async () => { 
    const radius = 10000; // 10 km in meters 

    const result = await getAllSellers({ lng: -74.0060, lat: 40.7128 }, 10, undefined);
    
    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with sell_map_center within geospatial radius */
    expect(result).toHaveLength(
      await Seller.countDocuments({
        seller_type: { $ne: SellerType.Inactive },
        'sell_map_center.coordinates': {
          $geoWithin: {
            $centerSphere: [[-74.0060, 40.7128], radius / 6378137]
          },
        },
      })
    ); // Ensure length matches expected sellers
  });

  it('should fetch all applicable sellers when all parameters are provided', async () => {
    const searchQuery = 'Vendor';
    const radius = 10000; // 10 km in meters 

    const result = await getAllSellers({ lng: -74.0060, lat: 40.7128 }, 10, 'Vendor');

    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with "Vendor"
       + include those with sell_map_center within geospatial radius */
    expect(result).toHaveLength(
      await Seller.countDocuments({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { sale_items: { $regex: searchQuery, $options: 'i' } },
        ],
        seller_type: { $ne: SellerType.Inactive },
        'sell_map_center.coordinates': {
          $geoWithin: {
            $centerSphere: [[-74.0060, 40.7128], radius / 6378137]
          },
        },
      })
    ); // Ensure length matches expected sellers
  });
});
