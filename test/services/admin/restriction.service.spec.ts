import { validateSellerLocation } from '../../../src/services/admin/restriction.service';
import SanctionedRegion from '../../../src/models/misc/SanctionedRegion';
import { RestrictedArea } from '../../../src/models/enums/restrictedArea';

jest.mock('../../../src/models/misc/SanctionedRegion');

describe('validateSellerLocation function', () => {
  const longitude = 123.5;
  const latitude = 40.5;

  const mockSanctionedRegion = {
    location: RestrictedArea.NORTH_KOREA,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [123.5, 37.5],
        [131.2, 37.5],
        [131.2, 43.0],
        [123.5, 43.0],
        [123.5, 37.5],
      ]],
    },
  }; 

  it('should return a sanctioned region given the coordinates is found', async () => {
    (SanctionedRegion.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSanctionedRegion),
    });

    const result = await validateSellerLocation(longitude, latitude);

    expect(SanctionedRegion.findOne).toHaveBeenCalledWith({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
    });

    expect(result).toEqual(mockSanctionedRegion);
  });

  it('should return null if no sanctioned region given the coordinates is found', async () => {
    (SanctionedRegion.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await validateSellerLocation(longitude, latitude);
    expect(result).toBeNull();
  });
});