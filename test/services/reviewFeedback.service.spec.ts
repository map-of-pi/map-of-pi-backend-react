import { addReviewFeedback, getReviewFeedbackById } from '../../src/services/reviewFeedback.service';
import ReviewFeedback from '../../src/models/ReviewFeedback';
import User from '../../src/models/User';
import { IReviewFeedback, IUser } from '../../src/types';

describe('getReviewFeedbackById function', () => {
  it('should return the main review and its associated replies', async () => {
    const usersData = await User.find();

    const reviewData = await ReviewFeedback.findOne({
      _id: '64f5a0f2a86d1f9f3b7e4e81' 
    }) as IReviewFeedback;

    const reviewRepliesData = await ReviewFeedback.find({
      reply_to_review_id: reviewData._id
    }) as IReviewFeedback[];

    const result = await getReviewFeedbackById(reviewData._id.toString());

    // Convert Mongoose documents to plain objects
    const plainReviewData = reviewData.toObject();
    const plainReviewRepliesData = reviewRepliesData
      .map(reply => reply.toObject())
      .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());

    // Assertions for the main review
    expect(result?.review).toMatchObject({
      ...plainReviewData,
      giver: usersData[1].user_name,
      receiver: usersData[0].user_name,
      comment: '0b0b0b-0b0b-0b0b Test Review Comment',
      rating: 5
    });

    // Assertions for the replies sorted by most recent review_date.
    expect(result?.replies).toHaveLength(2);
    expect(result?.replies[0]).toMatchObject({
      ...plainReviewRepliesData[0],
      giver: usersData[3].user_name,
      receiver: usersData[0].user_name,
      comment: '0d0d0d-0d0d-0d0d Test Reply Comment',
      rating: 3,
    });
    expect(result?.replies[1]).toMatchObject({
      ...plainReviewRepliesData[1],
      giver: usersData[2].user_name,
      receiver: usersData[0].user_name,
      comment: '0c0c0c-0c0c-0c0c Test Reply Comment',
      rating: 4,
    });
  });
});

describe('addReviewFeedback function', () => {
  const formData = {
    review_receiver_id: '0a0a0a-0a0a-0a0a',
    review_giver_id: '0b0b0b-0b0b-0b0b',
    reply_to_review_id: null,
    rating: 5,
    comment: '0b0b0b-0b0b-0b0b Test Review Comment',
    image: 'http://example.com/image_new.jpg'
  };

  it('should add new review feedback and compute ratings', async () => {
    const userData = await User.findOne({
      pi_uid: '0b0b0b-0b0b-0b0b'
    }) as IUser;

    const reviewFeedbackData = await addReviewFeedback(userData, formData, formData.image);
    
    expect(reviewFeedbackData).toEqual(expect.objectContaining({
      review_receiver_id: formData.review_receiver_id,
      review_giver_id: formData.review_giver_id,
      reply_to_review_id: formData.reply_to_review_id,
      rating: formData.rating,
      comment: formData.comment,
      image: formData.image
    }));
  });
});
