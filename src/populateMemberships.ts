import mongoose from "mongoose";
import dotenv from "dotenv";
import Membership from "./models/membership";
import User from "./models/User";
import { MembershipClassType } from "./models/enums/membershipClassType";

dotenv.config();

const populateMemberships = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
      "mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority"
    );

    const users = await User.find({});
    if (!users.length) {
      console.log("No users found. Aborting.");
      return;
    }

    for (const user of users) {
      if (!user.pi_uid) {
        console.warn(`Skipping user with missing pi_uid: ${user._id}`);
        continue;
      }

      const exists = await Membership.exists({ pi_uid: user.pi_uid });
      if (exists) {
        console.log(`Membership already exists for ${user.pi_uid}. Skipping.`);
        continue;
      }

      const membership = new Membership({
        user_id: user._id,
        pi_uid: user.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        mappi_balance: 0,
        membership_expiration: null,
        mappi_used_to_date: 0,
      });

      await membership.save();
      console.log(`Created membership for ${user.pi_uid}`);
    }

    console.log("Memberships populated successfully!");
  } catch (error) {
    console.error("Error populating memberships:", error);
  } finally {
    await mongoose.connection.close();
  }
};

populateMemberships();