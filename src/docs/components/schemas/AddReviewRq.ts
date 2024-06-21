import { RatingScale } from "../../../models/enums/ratingScale";

export const AddReviewRq = {
  type: "object",
  properties: {
    review_id: {
      type: "string",
      example: "test_review_id_6674ecee2ac4de0d31e8c048",
    },
    review_receiver_id: {
      type: "string",
      example: "test_review_receiver_id",
    },
    review_giver_id: {
      type: "string",
      example: "test_review_giver_id",
    },
    reply_to_review_id: {
      type: "string",
      example: "test_reply_to_review_id",
    },
    rating: {
      type: "number",
      enum: Object.values(RatingScale),
      example: RatingScale.DELIGHT,
    },
    comment: {
      type: "string",
      example: "This is a sample review comment.",
    },
    image: {
      type: "string",
      example: "http://example.com/image.jpg",
    },
    review_date: {
      type: "string",
      format: "date-time",
      example: "2024-06-20T00:00:00.000Z",
    },
  },
  required: [
    "review_id",
    "review_receiver_id",
    "review_giver_id",
    "reply_to_review_id",
    "rating",
    "review_date",
  ],
};
