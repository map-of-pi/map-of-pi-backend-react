import { getReviewMetrics } from '../../../../src/controllers/admin/metrics/reviewFeedbackMetricsController';
import * as reviewFeedbackMetricsService from '../../../../src/services/misc/metrics/reviewFeedbackMetrics.service';

jest.mock('../../../../src/services/misc/metrics/reviewFeedbackMetrics.service', () => ({
  getAllReviews: jest.fn()
}));

describe('ReviewFeedbackMetricsController', () => {
  let req: any;
  let res: any;

  describe('getReviewMetrics function', () => {
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

    it('should return appropriate [200] when review metrics is successfully retrieved', async () => {
      const expectedReviewMetricsData = {};
      
      (reviewFeedbackMetricsService.getAllReviews as jest.Mock).mockResolvedValue(expectedReviewMetricsData);

      await getReviewMetrics(req, res);

      expect(reviewFeedbackMetricsService.getAllReviews).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedReviewMetricsData);
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while fetching review metrics; please try again later');

      (reviewFeedbackMetricsService.getAllReviews as jest.Mock).mockRejectedValue(mockError);

      await getReviewMetrics(req, res);

      expect(reviewFeedbackMetricsService.getAllReviews).toHaveBeenCalledWith(
        req.query.page,
        req.query.limit
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
