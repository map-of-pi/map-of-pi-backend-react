import { addReviewFeedback, getReviewFeedbackById } from '../../src/services/reviewFeedback.service';
import ReviewFeedback from '../../src/models/ReviewFeedback';
import User from '../../src/models/User';
import { IReviewFeedback, IUser } from '../../src/types';
import UserSettings from '../../src/models/UserSettings';

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
  let userData: IUser;

  const formData = {
    review_receiver_id: '0e0e0e-0e0e-0e0e',
    review_giver_id: '0a0a0a-0a0a-0a0a',
    reply_to_review_id: null,
    rating: '5',
    comment: '0a0a0a-0a0a-0a0a Test Review Comment',
    image: 'http://example.com/image_new.jpg'
  };

  beforeEach(async () => {
    userData = await User.findOne({ pi_uid: '0a0a0a-0a0a-0a0a' }) as IUser;
  });

  afterEach(async () => {
    // Clear and reset collections after each test
    await ReviewFeedback.deleteMany({});
  });

  // Helper function to add review feedback
  const addReviewAndAssert = async () => {
    const reviewFeedbackData = await addReviewFeedback(userData, formData, formData.image);

    // Assert common fields of review feedback
    expect(reviewFeedbackData).toEqual(expect.objectContaining({
      review_receiver_id: formData.review_receiver_id,
      review_giver_id: userData.pi_uid,
      reply_to_review_id: formData.reply_to_review_id,
      rating: Number(formData.rating),
      comment: formData.comment,
      image: formData.image
    }));
  };

  // Helper function to assert the computed trust meter rating
  const assertComputedRating = async (expectedRating: number) => {
    const updatedUserSettings = await UserSettings.findOne({ user_settings_id: formData.review_receiver_id });
    expect(updatedUserSettings?.trust_meter_rating).toBe(expectedRating);
  };

  it('should add new review feedback and compute ratings correctly with less than 2% zero ratings', async () => {
    await addReviewAndAssert();
    await assertComputedRating(100);
  });

  it('should add new review feedback and compute ratings correctly with 2%-5% zero ratings', async () => {
    await ReviewFeedback.insertMany([
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0a0a0a-0a0a-0a0a', rating: 0, comment: 'First Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0b0b0b-0b0b-0b0b', rating: 5, comment: 'First Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0c0c0c-0c0c-0c0c', rating: 5, comment: 'Second Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0d0d0d-0d0d-0d0d', rating: 5, comment: 'Third Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0e0e0e-0e0e-0e0e', rating: 5, comment: 'Fourth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0f0f0f-0f0f-0f0f', rating: 5, comment: 'Fifth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0g0g0g-0g0g-0g0g', rating: 4, comment: 'Sixth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0h0h0h-0h0h-0h0h', rating: 4, comment: 'Seventh Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0i0i0i-0i0i-0i0i', rating: 4, comment: 'Eighth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0j0j0j-0j0j-0j0j', rating: 4, comment: 'Ninth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0k0k0k-0k0k-0k0k', rating: 4, comment: 'Tenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0l0l0l-0l0l-0l0l', rating: 3, comment: 'Eleventh Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0m0m0m-0m0m-0m0m', rating: 3, comment: 'Twelveth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0n0n0n-0n0n-0n0n', rating: 3, comment: 'Thirteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0o0o0o-0o0o-0o0o', rating: 3, comment: 'Fourteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0p0p0p-0p0p-0p0p', rating: 3, comment: 'Fifteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0q0q0q-0q0q-0q0q', rating: 2, comment: 'Sixteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0r0r0r-0r0r-0r0r', rating: 2, comment: 'Seventeenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0s0s0s-0s0s-0s0s', rating: 2, comment: 'Eighteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0t0t0t-0t0t-0t0t', rating: 2, comment: 'Nineteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0u0u0u-0u0u-0u0u', rating: 2, comment: 'Twentieth Non-Zero Rating', review_date: new Date() }
    ]);

    await addReviewAndAssert();
    await assertComputedRating(80);
  });

  it('should add new review feedback and compute ratings correctly with 5%-10% zero ratings', async () => {
    await ReviewFeedback.insertMany([
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0a0a0a-0a0a-0a0a', rating: 0, comment: 'First Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0b0b0b-0b0b-0b0b', rating: 5, comment: 'First Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0c0c0c-0c0c-0c0c', rating: 5, comment: 'Second Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0d0d0d-0d0d-0d0d', rating: 5, comment: 'Third Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0e0e0e-0e0e-0e0e', rating: 5, comment: 'Fourth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0f0f0f-0f0f-0f0f', rating: 5, comment: 'Fifth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0g0g0g-0g0g-0g0g', rating: 4, comment: 'Sixth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0h0h0h-0h0h-0h0h', rating: 4, comment: 'Seventh Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0i0i0i-0i0i-0i0i', rating: 4, comment: 'Eighth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0j0j0j-0j0j-0j0j', rating: 4, comment: 'Ninth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0k0k0k-0k0k-0k0k', rating: 4, comment: 'Tenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0l0l0l-0l0l-0l0l', rating: 3, comment: 'Eleventh Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0m0m0m-0m0m-0m0m', rating: 3, comment: 'Twelveth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0n0n0n-0n0n-0n0n', rating: 3, comment: 'Thirteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0o0o0o-0o0o-0o0o', rating: 3, comment: 'Fourteenth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0p0p0p-0p0p-0p0p', rating: 3, comment: 'Fifteenth Non-Zero Rating', review_date: new Date() }
    ]);

    await addReviewAndAssert();
    await assertComputedRating(50);
  });

  it('should add new review feedback and compute ratings correctly with more than 10% zero ratings', async () => {
    await ReviewFeedback.insertMany([
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0a0a0a-0a0a-0a0a', rating: 0, comment: 'First Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0b0b0b-0b0b-0b0b', rating: 5, comment: 'First Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0c0c0c-0c0c-0c0c', rating: 5, comment: 'Second Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0d0d0d-0d0d-0d0d', rating: 5, comment: 'Third Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0e0e0e-0e0e-0e0e', rating: 5, comment: 'Fourth Non-Zero Rating', review_date: new Date() },
      { review_receiver_id: '0e0e0e-0e0e-0e0e', review_giver_id: '0f0f0f-0f0f-0f0f', rating: 5, comment: 'Fifth Non-Zero Rating', review_date: new Date() }
    ]);

    await addReviewAndAssert();
    await assertComputedRating(0);
  });
});
