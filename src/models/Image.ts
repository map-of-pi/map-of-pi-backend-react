import mongoose, { Schema } from "mongoose";

const imageSchema = new Schema(
  {
    image: String
  },
  {
    timestamps: true
  }
);

const Image = mongoose.model("Image", imageSchema);

export default Image;
