import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Seller from '../src/models/Seller';
import ReviewFeedback from '../src/models/ReviewFeedback';
import { SellerType } from '../src/models/enums/sellerType';
import { RatingScale } from '../src/models/enums/ratingScale';
import { IReviewFeedback, ISeller } from '../src/types';

dotenv.config();

const numberOfSanctionedSellers = 1;
const maxReviewsPerSeller = 5;

const regions = [
  // { name: "Mexico", minLat: 14.532866, maxLat: 32.718655, minLng: -118.455148, maxLng: -86.703392 }, // Mexico general bounds
  // { name: "Mexico City", minLat: 19.2000, maxLat: 19.6000, minLng: -99.3650, maxLng: -98.9000 }, // Mexico City bounds
  { name: "Cuba", minLat: 19.4, maxLat: 23.7, minLng: -85.3, maxLng: -73.8 },
  { name: "Iran", minLat: 24.0, maxLat: 40.5, minLng: 43.0, maxLng: 63.5 },
  { name: "North Korea", minLat: 37.5, maxLat: 43.0, minLng: 123.5, maxLng: 131.2 },
  { name: "Syria", minLat: 32.0, maxLat: 37.5, minLng: 35.5, maxLng: 42.5 },
  { name: "Republic of Crimea", minLat: 43.8, maxLat: 46.4, minLng: 32.1, maxLng: 36.8 },
  { name: "Donetsk Oblast", minLat: 46.6, maxLat: 49.3, minLng: 36.2, maxLng: 39.1 },
  { name: "Luhansk Oblast", minLat: 47.7, maxLat: 50.1, minLng: 37.7, maxLng: 40.3 },
];

// Create an array of the valid RatingScale values
const ratingValues = [RatingScale.DESPAIR, RatingScale.SAD, RatingScale.OKAY, RatingScale.HAPPY, RatingScale.DELIGHT];

const getRandomCoordinates = (regionName: string) => {
  const region = regions.find(r => r.name === regionName);
  if (!region) throw new Error(`Region "${regionName}" not found`);
  const lat = Math.random() * (region.maxLat - region.minLat) + region.minLat;
  const lng = Math.random() * (region.maxLng - region.minLng) + region.minLng;
  return [lng, lat];
};

const getRandomRating = () => {
  const randomIndex = Math.floor(Math.random() * ratingValues.length);
  return ratingValues[randomIndex];
};

const createSeller = (index: number, region: string) => {
  return new Seller({
    seller_id: `${region}_0ss0ss0ss-0ss0ss-0ss0ss_${index}`,
    name: `${region} Mock Sanctioned Seller ${index}`,
    seller_type: SellerType.Test,
    description: `Description for ${region} Mock Sanctioned Seller ${index}`,
    image: 'https://res.cloudinary.com/dcdcqbdsj/image/upload/v1729512851/map-of-pi-deactivated_j5qvqp.png',
    address: `Location in ${region}`,
    average_rating: mongoose.Types.Decimal128.fromString("5"),
    sell_map_center: {
      type: "Point",
      coordinates: getRandomCoordinates(region)
    },
  });
}

const createReview = (sellerId: string, allSellerIds: string[]) => {
  // Filter out the receiver_sellerId from the list of potential givers
  const otherSellers = allSellerIds.filter(id => id !== sellerId);

  // Randomly select a sellerId from the remaining sellers
  const giver_sellerId = otherSellers[Math.floor(Math.random() * otherSellers.length)];

  return new ReviewFeedback({
    review_receiver_id: sellerId,
    review_giver_id: giver_sellerId,
    reply_to_review_id: null,
    comment: `This is a mock review left by seller ${giver_sellerId}`,
    rating: getRandomRating(),
    review_date: new Date()
  });
};

// Insert sellers into MongoDB
const insertSellers = async () => {
  const mongoUri = 'mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority';
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const sellers: ISeller[] = [];
    
    // Generate sellers in Sanctioned Regions
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Cuba");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Iran");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "North Korea");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Syria");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Republic of Crimea");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Donetsk Oblast");
      sellers.push(seller);
    }
    for (let i = 1; i <= numberOfSanctionedSellers; i++) {
      const seller = createSeller(i, "Luhansk Oblast");
      sellers.push(seller);
    }

    // Insert sellers into the Seller collection
    await Seller.insertMany(sellers);
    console.log('Inserted sellers into MongoDB');

    // Generate reviews for each seller
    const reviews: IReviewFeedback[] = [];
    const allSellerIds = sellers.map(seller => (seller.toObject() as ISeller).seller_id);

    sellers.forEach((seller) => {
      const numReviews = Math.floor(Math.random() * maxReviewsPerSeller) + 1;
      for (let i = 0; i < numReviews; i++) {
        const review = createReview((seller.toObject() as ISeller).seller_id, allSellerIds);
        reviews.push(review);
      }
    });

    // Insert reviews into the Review collection
    await ReviewFeedback.insertMany(reviews);
    console.log('Inserted reviews into MongoDB');
  } catch (error) {
    console.error("Error inserting sellers/reviews:", (error as Error).message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

const deleteSanctionedSellersData = async () => {
  const mongoUri = 'mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority';
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Delete sellers with "Sanctioned" in their name
    const sellerResult = await Seller.deleteMany({ name: /Sanctioned/i });
    console.log(`${sellerResult.deletedCount} sellers removed.`);

    // Delete reviews with specific review_receiver_id
    const reviewResult = await ReviewFeedback.deleteMany({ review_receiver_id: /0ss0ss0ss/i });
    console.log(`${reviewResult.deletedCount} review feedbacks removed.`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error removing sanctioned sellers data:", error);
  }
};

// Call the function to insert sellers and reviews
insertSellers();

// Call the function to delete sellers and reviews
// deleteSanctionedSellersData();