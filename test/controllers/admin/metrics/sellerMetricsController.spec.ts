import { getSellerMetrics } from '../../../../src/controllers/admin/metrics/sellerMetricsController';
import * as sellerMetricsService from '../../../../src/services/misc/metrics/sellerMetrics.service';

jest.mock('../../../../src/services/misc/metrics/sellerMetrics.service', () => ({
  getAllSellers: jest.fn()
}));

describe('SellerMetricsController', () => {
  let req: any;
  let res: any;

  describe('getSellerMetrics function', () => {
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

    it('should return appropriate [200] when seller metrics is successfully retrieved', async () => {
      const expectedSellerMetricsData = {};
      
      (sellerMetricsService.getAllSellers as jest.Mock).mockResolvedValue(expectedSellerMetricsData);

      await getSellerMetrics(req, res);

      expect(sellerMetricsService.getAllSellers).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedSellerMetricsData);
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while fetching seller metrics; please try again later');

      (sellerMetricsService.getAllSellers as jest.Mock).mockRejectedValue(mockError);

      await getSellerMetrics(req, res);

      expect(sellerMetricsService.getAllSellers).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
