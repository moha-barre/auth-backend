import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("database connected successfully");
    });
    
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
    
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;