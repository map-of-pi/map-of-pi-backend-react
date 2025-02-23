import { getTotalUserMetrics, getUserMetrics } from '../../../../src/controllers/admin/metrics/userMetricsController';
import * as userMetricsService from '../../../../src/services/misc/metrics/userMetrics.service';

jest.mock('../../../../src/services/misc/metrics/userMetrics.service', () => ({
  getTotalUsers: jest.fn(),
  getUserStats: jest.fn()
}));

describe('UserMetricsController', () => {
  let req: any;
  let res: any;

  describe('getTotalUserMetrics function', () => {
    beforeEach(() => {
      req = {
        query: {
          page: 1,
          limit: 5
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when total user metrics is successfully retrieved', async () => {
      const expectedTotalUserMetricsData = {};
      
      (userMetricsService.getTotalUsers as jest.Mock).mockResolvedValue(expectedTotalUserMetricsData);

      await getTotalUserMetrics(req, res);

      expect(userMetricsService.getTotalUsers).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedTotalUserMetricsData);
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while fetching total user metrics; please try again later');

      (userMetricsService.getTotalUsers as jest.Mock).mockRejectedValue(mockError);

      await getTotalUserMetrics(req, res);

      expect(userMetricsService.getTotalUsers).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('UserMetricsController', () => {
    let req: any;
    let res: any;
  
    describe('getUserMetrics function', () => {
      beforeEach(() => {
        req = {};
        res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
      });
  
      it('should return appropriate [200] when user metrics is successfully retrieved', async () => {
        const expectedUserMetricsData = {};
        
        (userMetricsService.getUserStats as jest.Mock).mockResolvedValue(expectedUserMetricsData);
  
        await getUserMetrics(req, res);
  
        expect(userMetricsService.getUserStats).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expectedUserMetricsData);
      });
  
      it('should return appropriate [500] for an internal server error', async () => {
        const mockError = new Error('An error occurred while fetching user metrics; please try again later');
  
        (userMetricsService.getUserStats as jest.Mock).mockRejectedValue(mockError);
  
        await getUserMetrics(req, res);
  
        expect(userMetricsService.getUserStats).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
      });
    });
  });
});
