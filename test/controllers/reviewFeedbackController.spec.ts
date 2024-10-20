import { getReviews } from '../../src/controllers/reviewFeedbackController';
import * as reviewFeedbackService from '../../src/services/reviewFeedback.service';

jest.mock('../../src/services/reviewFeedback.service', () => ({
  getReviewFeedback: jest.fn()
}));

describe('reviewFeedbackController', () => {
  let req: any;
  let res: any;

  const mockReviews = {
    givenReviews: [
      {
        _id: '64f5a0f2a86d1f9f3b7e4e81',
        review_receiver_id: '0b0b0b-0b0b-0b0b',
        review_giver_id: '0a0a0a-0a0a-0a0a',
        reply_to_review_id: null,
        giver: 'Test_A',
        receiver: 'Test_B',
        comment: '0a0a0a-0a0a-0a0a Test Review Comment',
        rating: 5,
        image: 'http://example.com/image.jpg',
        review_date: '2024-10-14T00:00:00.000Z',
      },
    ],
    receivedReviews: [
      {
        _id: '64f5a0f2a86d1f9f3b7e4e82',
        review_receiver_id: '0a0a0a-0a0a-0a0a',
        review_giver_id: '0c0c0c-0c0c-0c0c',
        reply_to_review_id: null,
        giver: 'Test_C',
        receiver: 'Test_A',
        comment: '0c0c0c-0c0c-0c0c Test Review Comment',
        rating: 3,
        image: 'http://example.com/image.jpg',
        review_date: '2024-10-15T00:00:00.000Z',
      }
    ],
  };

  beforeEach(() => {
    req = {
      params: { review_receiver_id: '0a0a0a-0a0a-0a0a' },
      query: { searchQuery: 'Test_C' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getReviews', () => {
    it('should get associated reviews successfully if search query is not provided', async () => {
      req.query = {}; // no search query
      
      (reviewFeedbackService.getReviewFeedback as jest.Mock).mockResolvedValue(mockReviews);

      await getReviews(req, res);

      expect(reviewFeedbackService.getReviewFeedback).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        givenReviews: expect.any(Array),
        receivedReviews: expect.any(Array),
      });
    });

    it('should get associated reviews successfully if search query is provided', async () => {
      (reviewFeedbackService.getReviewFeedback as jest.Mock).mockResolvedValue(mockReviews);

      await getReviews(req, res);

      expect(reviewFeedbackService.getReviewFeedback).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 'Test_C');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        givenReviews: expect.any(Array),
        receivedReviews: expect.any(Array),
      });
    });

    it('should return appropriate [500] if retrieving reviews fails', async () => {
      req.query = {}; // no search query
      
      const mockError = new Error('An error occurred while getting reviews; please try again later');
      
      (reviewFeedbackService.getReviewFeedback as jest.Mock).mockRejectedValue(mockError);

      await getReviews(req, res);

      expect(reviewFeedbackService.getReviewFeedback).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', undefined);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});