import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { addReviewFeedback } from '../../src/services/reviewFeedback.service';
import ReviewFeedback from '../../src/models/ReviewFeedback';
import { IUser } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUser = {
  pi_uid: '123-456-7890',
  pi_username: 'TestUser',
} as IUser;

const formData = {
  review_receiver_id: '098-765-4321',
  review_giver_id: mockUser.pi_uid,
  reply_to_review_id: null,
  rating: '5',
  comment: 'test comment',
  image: 'http://example.com/image_new.jpg'
};

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('addReviewFeedback function', () => {
  it('should add new review feedback and compute ratings', async () => {
    // mock the save function to return the newly created review
    const mockSave = jest.fn().mockResolvedValue({
      ...formData
    })
    jest.spyOn(ReviewFeedback.prototype, 'save').mockImplementation(mockSave);

    // TODO - mock computeRatings function

    const result = await addReviewFeedback(mockUser, formData, formData.image);
    
    expect(result).toHaveProperty('review_receiver_id', formData.review_receiver_id);
    expect(result).toHaveProperty('review_giver_id', formData.review_giver_id);
    expect(result).toHaveProperty('reply_to_review_id', formData.reply_to_review_id);
    expect(result).toHaveProperty('rating', formData.rating);
    expect(result).toHaveProperty('comment', formData.comment);
    expect(result).toHaveProperty('image', formData.image);
  });
});
