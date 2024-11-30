import Seller from '../../src/models/Seller';
import { reverseLocationDetails } from '../../src/helpers/location';
import { RestrictedAreaBoundaries } from '../../src/models/enums/restrictedArea';
import { reportSanctionedSellers } from '../../src/services/report.service';

jest.mock('../../src/helpers/location', () => ({
  reverseLocationDetails: jest.fn()
}));

describe('reportSanctionedSellers function', () => {
  it('should build sanctioned sellers report for affected sellers', async () => {
    ( reverseLocationDetails as jest.Mock)
      .mockResolvedValueOnce({ data: { display_name: 'Cuba' } })
      .mockResolvedValueOnce({ data: { display_name: 'Iran' } })
      .mockResolvedValueOnce({ data: { display_name: 'North Korea' } })
      .mockResolvedValueOnce({ data: { display_name: 'Syria' } })
      .mockResolvedValueOnce({ data: { display_name: 'Republic of Crimea' } })
      .mockResolvedValueOnce({ data: { display_name: 'Donetsk Oblast' } })
      .mockResolvedValueOnce({ data: { display_name: 'Luhansk Oblast' } });

    const sanctionedSellers = await reportSanctionedSellers();

    // calculate the total expected count of sellers in all restricted areas
    const totalExpectedCount = await Promise.all(
      Object.values(RestrictedAreaBoundaries).map((region) =>
        Seller.countDocuments({
          sell_map_center: {
            $geoWithin: {
              $geometry: region,
            },
          },
        })
      )
    ).then((counts) => counts.reduce((sum, count) => sum + count, 0));

    expect(reverseLocationDetails).toHaveBeenCalledTimes(totalExpectedCount);
    expect(reverseLocationDetails).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    expect(sanctionedSellers).toHaveLength(totalExpectedCount);
  });
});