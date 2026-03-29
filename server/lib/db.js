import mongoose from "mongoose";

// function to connect to the database
export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}`);
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};