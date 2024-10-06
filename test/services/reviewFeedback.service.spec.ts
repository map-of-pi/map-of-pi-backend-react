import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { getReviewFeedbackById, addReviewFeedback } from '../../src/services/reviewFeedback.service';
import ReviewFeedback from '../../src/models/ReviewFeedback';
import User from '../../src/models/User';
import * as userService from '../../src/services/user.service';
import { IUser } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUsers = [
  {
    pi_uid: '0a0a0a-0a0a-0a0a',
    pi_username: 'TestUser_1',
    user_name: 'test-user-1'
  },
  {
    pi_uid: '0b0b0b-0b0b-0b0b',
    pi_username: 'TestUser_2',
    user_name: 'test-user-2'
  },
  {
    pi_uid: '0c0c0c-0c0c-0c0c',
    pi_username: 'TestUser_3',
    user_name: 'test-user-3'
  },
  {
    pi_uid: '0d0d0d-0d0d-0d0d',
    pi_username: 'TestUser_4',
    user_name: 'test-user-4'
  },
] as IUser[];

const mockReview = {
  _id: new mongoose.Types.ObjectId('64f5a0f2a86d1f9f3b7e4e81'),
  review_receiver_id: '0a0a0a-0a0a-0a0a',
  review_giver_id: '0b0b0b-0b0b-0b0b',
  comment: '0b0b0b-0b0b-0b0b Test Review Comment',
  rating: 5,
  review_date: new Date()
};

const mockReviewReplies = [
  {
    _id: new mongoose.Types.ObjectId('64f5a0f2a86d1f9f3b7e4e82'),
    review_receiver_id: '0a0a0a-0a0a-0a0a',
    review_giver_id: '0c0c0c-0c0c-0c0c',
    reply_to_review_id: '64f5a0f2a86d1f9f3b7e4e81',
    comment: '0c0c0c-0c0c-0c0c Test Reply Comment',
    rating: 4,
    review_date: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('64f5a0f2a86d1f9f3b7e4e83'),
    review_receiver_id: '0a0a0a-0a0a-0a0a',
    review_giver_id: '0d0d0d-0d0d-0d0d',
    reply_to_review_id: '64f5a0f2a86d1f9f3b7e4e81',
    comment: '0d0d0d-0d0d-0d0d Test Reply Comment',
    rating: 3,
    review_date: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('64f5a0f2a86d1f9f3b7e4e84'),
    review_receiver_id: '0b0b0b-0b0b-0b0b',
    review_giver_id: '0e0e0e-0e0e-0e0e',
    reply_to_review_id: null,
    comment: '0e0e0e-0e0e-0e0e Test Reply Comment',
    rating: 5,
    review_date: new Date()
  }
];

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });

    // initialize in-memory MongoDB by inserting mock data records
    await ReviewFeedback.insertMany([mockReview, ...mockReviewReplies]);
    await User.insertMany(mockUsers);
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('getReviewFeedbackById function', () => {
  // Mock ReviewFeedback.findById for fetching the main review
  jest.spyOn(ReviewFeedback, 'findById').mockResolvedValue(mockReview);
  // Mock ReviewFeedback.find for fetching the replies

  jest.spyOn(ReviewFeedback, 'find').mockResolvedValue(mockReviewReplies);
  // Mock the getUser function to return the mock user records
  jest.spyOn(userService, 'getUser').mockResolvedValue(mockUsers[0]);

  it('should return the main review and its associated replies', async () => {
    const result = await getReviewFeedbackById(mockReview._id.toString());

    // Assertions for the main review
    expect(result?.review).toMatchObject({
      ...mockReview,
      giver: mockUsers[1].user_name,
      receiver: mockUsers[0].user_name,
      comment: '0b0b0b-0b0b-0b0b Test Review Comment',
      rating: 5
    });

    // Assertions for the replies
    expect(result?.replies).toHaveLength(2);
    expect(result?.replies[0]).toMatchObject({
      ...mockReviewReplies[0],
      giver: mockUsers[2].user_name,
      receiver: mockUsers[0].user_name,
      comment: '0c0c0c-0c0c-0c0c Test Reply Comment',
      rating: 4,
    });
    expect(result?.replies[1]).toMatchObject({
      ...mockReviewReplies[1],
      giver: mockUsers[3].user_name,
      receiver: mockUsers[0].user_name,
      comment: '0d0d0d-0d0d-0d0d Test Reply Comment',
      rating: 3,
    });
  });
});

describe('addReviewFeedback function', () => {
  const formData = {
    review_receiver_id: '0a0a0a-0a0a-0a0a',
    review_giver_id: '0b0b0b-0b0b-0b0b',
    reply_to_review_id: null,
    rating: '5',
    comment: '0b0b0b-0b0b-0b0b Test Review Comment',
    image: 'http://example.com/image_new.jpg'
  };

  it('should add new review feedback and compute ratings', async () => {
    // mock the save function to return the newly created review
    const mockSave = jest.fn().mockResolvedValue({
      ...formData
    })
    jest.spyOn(ReviewFeedback.prototype, 'save').mockImplementation(mockSave);

    // TODO - mock computeRatings function

    const result = await addReviewFeedback(mockUsers[0], formData, formData.image);
    
    expect(result).toHaveProperty('review_receiver_id', formData.review_receiver_id);
    expect(result).toHaveProperty('review_giver_id', formData.review_giver_id);
    expect(result).toHaveProperty('reply_to_review_id', formData.reply_to_review_id);
    expect(result).toHaveProperty('rating', formData.rating);
    expect(result).toHaveProperty('comment', formData.comment);
    expect(result).toHaveProperty('image', formData.image);
  });
});
