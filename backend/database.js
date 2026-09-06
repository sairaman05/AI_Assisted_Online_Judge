import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DBConnection = async () => {
    const MONGODB_URL = process.env.MONGO_URI;
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected successfully to MongoDB");
    } catch (error) {
        console.log("MongoDB Connection Error:", error.message);
    }
};

export default DBConnection;