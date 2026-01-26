import mongoose from "mongoose";

export default async () => {
    const mongoUri = process.env.MONGODB_URI;
    console.log("Attempting to connect to MongoDB with URI:", mongoUri ? mongoUri.replace(/:.+@/, ":****@") : "UNDEFINED");

    try {
        const connect = await mongoose.connect(mongoUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });

        console.log(`MongoDB connected: ${connect.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        process.exit(1);
    }
};
