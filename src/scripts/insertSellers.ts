import mongoose from 'mongoose';
import Seller from '../models/Seller'; // Ensure this path is correct
import * as dotenv from 'dotenv';

dotenv.config();

const numberOfSellers = 10;

const regions = [
  { name: "North America", minLat: 24.396308, maxLat: 49.384358, minLng: -125.0, maxLng: -66.93457 },
  // other regions...
];

const getRandomCoordinates = () => {
  const region = regions[Math.floor(Math.random() * regions.length)];
  const lat = Math.random() * (region.maxLat - region.minLat) + region.minLat;
  const lng = Math.random() * (region.maxLng - region.minLng) + region.minLng;
  return [lng, lat];
};

  const createOldSchemaSeller = (index: number) => {
    return {
      seller_id: `old_seller_${index}`,
      name: `Old Seller ${index}`,
      description: `Old Description for seller ${index}`,
      image: `https://example.com/image.jpg`,
      address: `1234 Test St, Test City, SC 12345`,
      sale_items: `Test Item 1, Test Item 2`,
      average_rating: mongoose.Types.Decimal128.fromString("4.5"),
      trust_meter_rating: 50,
      coordinates: {
        type: "Point",
        coordinates: getRandomCoordinates()
      },
      order_online_enabled_pref: true
    };
  };

  const createNewSchemaSeller = (index: number) => {
    return {
      seller_id: `new_seller_${index}`,
      name: `New Seller ${index}`,
      description: `New Description for seller ${index}`,
      image: `https://example.com/image.jpg`,
      address: `1234 Test St, Test City, SC 12345`,
      sale_items: `Test Item 1, Test Item 2`,
      average_rating: mongoose.Types.Decimal128.fromString("4.5"),
      trust_meter_rating: 50,
      sell_map_center: {
        type: "Point",
        coordinates: getRandomCoordinates()
      },
      order_online_enabled_pref: true
    };
  };

const insertSellers = async () => {
  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Insert sellers with the old schema
    const oldSellers = [];
    for (let i = 1; i <= numberOfSellers; i++) {
      const seller = createOldSchemaSeller(i);
      oldSellers.push(seller);
      console.log(`Created old schema seller: ${seller.seller_id}`);
    }
    await Seller.insertMany(oldSellers);

    // Insert sellers with the new schema
    const newSellers = [];
    for (let i = 1; i <= numberOfSellers; i++) {
      const seller = createNewSchemaSeller(i);
      newSellers.push(seller);
      console.log(`Created new schema seller: ${seller.seller_id}`);
    }
    await Seller.insertMany(newSellers);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error("Error inserting sellers:", (error as Error).message);
  }
};

insertSellers();
