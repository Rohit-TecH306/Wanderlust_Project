const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const sampleCoordinates = {
  "Malibu, United States": [-118.7798, 34.0259],
  "New York City, United States": [-74.006, 40.7128],
  "Aspen, United States": [-106.8175, 39.1911],
  "Florence, Italy": [11.2558, 43.7696],
  "Portland, United States": [-122.6784, 45.5152],
  "Cancun, Mexico": [-86.8515, 21.1619],
  "Lake Tahoe, United States": [-120.0324, 39.0968],
  "Los Angeles, United States": [-118.2437, 34.0522],
  "Verbier, Switzerland": [7.2284, 46.0967],
  "Serengeti National Park, Tanzania": [34.8333, -2.3333],
  "Amsterdam, Netherlands": [4.9041, 52.3676],
  "Fiji, Fiji": [178.065, -17.7134],
  "Cotswolds, United Kingdom": [-1.8433, 51.833],
  "Boston, United States": [-71.0589, 42.3601],
  "Bali, Indonesia": [115.1889, -8.4095],
  "Banff, Canada": [-115.5708, 51.1784],
  "Miami, United States": [-80.1918, 25.7617],
  "Phuket, Thailand": [98.3923, 7.8804],
  "Scottish Highlands, United Kingdom": [-4.2026, 57.1201],
  "Dubai, United Arab Emirates": [55.2708, 25.2048],
  "Montana, United States": [-110.3626, 46.8797],
  "Mykonos, Greece": [25.3289, 37.4467],
  "Costa Rica, Costa Rica": [-84.0907, 9.7489],
  "Charleston, United States": [-79.9311, 32.7765],
  "Tokyo, Japan": [139.6917, 35.6895],
  "New Hampshire, United States": [-71.5724, 43.1939],
  "Maldives, Maldives": [73.2207, 3.2028]
};

const initDB = async () => {
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");

  const ownerUser = await User.findOne({ username: "Rohit Bhabire" });
  if (!ownerUser) {
    throw new Error("User 'Rohit Bhabire' not found. Sign up first or create that user.");
  }

  await Listing.deleteMany({});

  const dataWithOwner = initData.data.map((obj) => {
    const coordinates = sampleCoordinates[`${obj.location}, ${obj.country}`];

    if (!coordinates) {
      throw new Error(`Missing coordinates for ${obj.location}, ${obj.country}`);
    }

    return {
      ...obj,
      geometry: {
        type: "Point",
        coordinates
      },
      owner: ownerUser._id
    };
  });

  await Listing.insertMany(dataWithOwner);
  console.log("data was initialized");
  console.log("Owner assigned to:", ownerUser.username, ownerUser._id);
  await mongoose.disconnect();
};

initDB()
  .catch((err) => {
    console.log("DB init failed:", err);
  });