const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: 'https://frontend-td5q.onrender.com',
    credentials: true
}));

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "Task Service",
        status: "Running",
        timestamp: new Date(),
    });
});
// add this new route for testing inter-service communication

app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`✅ Task Service running on port ${PORT}`);
});