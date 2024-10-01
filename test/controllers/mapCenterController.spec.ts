import { saveMapCenter, getMapCenter } from '../../src/controllers/mapCenterController';
import * as mapCenterService from '../../src/services/mapCenter.service';

jest.mock('../../src/services/mapCenter.service', () => ({
  createOrUpdateMapCenter: jest.fn(),
  getMapCenterById: jest.fn(),
}));

describe('MapCenterController', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      currentUser: {
        pi_uid: '0a0a0a-0a0a-0a0a'
      },
      body: {
        longitude: 45.123,
        latitude: 23.456,
        type: 'search'
      },
      params: {
        type: 'search'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('saveMapCenter', () => {
    it('should save map center successfully', async () => {
      const mockMapCenter = { map_center_id: '0a0a0a-0a0a-0a0a', longitude: 45.123, latitude: 23.456 };
      (mapCenterService.createOrUpdateMapCenter as jest.Mock).mockResolvedValue(mockMapCenter);

      await saveMapCenter(req, res);

      expect(mapCenterService.createOrUpdateMapCenter).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 45.123, 23.456, 'search');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ uid: '0a0a0a-0a0a-0a0a', map_center: mockMapCenter });
    });

    it('should return appropriate [500] if saving map center fails', async () => {
      const mockError = new Error('An error occurred while saving the Map Center; please try again later');
      
      (mapCenterService.createOrUpdateMapCenter as jest.Mock).mockRejectedValue(mockError);

      await saveMapCenter(req, res);

      expect(mapCenterService.createOrUpdateMapCenter).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 45.123, 23.456, 'search');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
