import mongoose from "mongoose";

// Cached connection variable
let isConnected = false;

export default async () => {
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return;
    }

    const mongoUri = process.env.MONGODB_URI;
    console.log("Attempting to connect to MongoDB with URI:", mongoUri ? mongoUri.replace(/:.+@/, ":****@") : "UNDEFINED");

    try {
        const connect = await mongoose.connect(mongoUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });

        isConnected = connect.connections[0].readyState;
        console.log(`MongoDB connected: ${connect.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        process.exit(1);
    }
};
