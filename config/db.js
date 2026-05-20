const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Task Service MongoDB Connected");
    } catch (error) {
        console.log("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;