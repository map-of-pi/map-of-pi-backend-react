import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User";
import { env } from "../src/utils/env"

dotenv.config();

const dedupeUsers = async () => {
  await mongoose.connect(env.MONGODB_URL);

  const duplicates = await User.aggregate([
    { $group: { _id: "$pi_uid", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const dup of duplicates) {
    const [, ...duplicateIds] = dup.ids; // keep the first, delete the rest
    await User.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Deleted ${duplicateIds.length} duplicate(s) for pi_uid: ${dup._id}`);
  }

  console.log("All duplicates removed.");
  await mongoose.disconnect();
};

dedupeUsers();