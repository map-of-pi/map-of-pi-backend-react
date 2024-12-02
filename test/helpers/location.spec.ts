import axios from 'axios';
import { reverseLocationDetails } from '../../src/helpers/location';

jest.mock('axios');

describe('reverseLocationDetails function', () => {
  it('should return location details from Nominatim API', async () => {
    // mock axios.get to return a resolved promise with the expected data
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        display_name: 'Havana, Cuba'
      }
    });

    const result = await reverseLocationDetails(23.1136, -82.3666);

    expect(axios.get).toHaveBeenCalledWith('https://nominatim.openstreetmap.org/reverse', {
      headers: {
        'User-Agent': 'mapofpi/1.0 (mapofpi@gmail.com)',
      },
      params: {
        lat: 23.1136,
        lon: -82.3666,
        zoom: 6,
        format: 'jsonv2',
        'accept-language': 'en',
      },
    });

    expect(result).toEqual({
      data: {
        display_name: 'Havana, Cuba'
      }
    });
  });
});
