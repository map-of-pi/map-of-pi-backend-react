import mongoose from "mongoose";
import dotenv from "dotenv";
import Membership from "../../src/models/Membership";
import User from "../../src/models/User";

dotenv.config();

const populateMemberships = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority");

    // Fetch all users
    const users = await User.find({});
    if (!users.length) {
      console.log("No users found. Aborting.");
      return;
    }

    // Iterates over each user and create a Membership entry
    for (const user of users) {
      console.log(`Processing user: ${user._id} - ${user.pi_uid}`);
    
      const existingMembership = await Membership.findOne({ user_id: user._id });
      if (existingMembership) {
        console.log(`Membership already exists for user ID: ${user._id}. Skipping.`);
        continue;
      }
    
      const membership = new Membership({
        user_id: user._id,
        pi_uid: user.pi_uid,
        membership_class: "Casual",
        mappi_balance: 0,
        membership_expiration: null,
        mappi_used_to_date: 0,
      });
    
      await membership.save();
      console.log(`Created membership for user ID: ${user._id}`);
    }    

    console.log("Memberships created successfully for all users!");
  } catch (error) {
    console.error("Error populating memberships:", error);
  } finally {
    mongoose.connection.close();
  }
};

populateMemberships();
