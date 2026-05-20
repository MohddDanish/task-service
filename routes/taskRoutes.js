const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const checkProjectMember = require("../middleware/projectMemberMiddleware");
const {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    getUserTasks,
    acceptTask,           // ← ADD
    rejectTask,           // ← ADD
    getMyAssignedTasks,   // ← ADD
    getPendingTasks,      // ← ADD
} = require("../controllers/taskController");

// Protected routes (all need auth)
router.use(verifyToken);

// Task acceptance routes
router.put("/:id/accept", acceptTask);           // ← ADD
router.put("/:id/reject", rejectTask);           // ← ADD
router.get("/my-tasks", getMyAssignedTasks);     // ← ADD
router.get("/pending-tasks", getPendingTasks);   // ← ADD

// Get user's tasks
router.get("/my-tasks", getUserTasks);

// Create task (needs project membership)
router.post("/", checkProjectMember, createTask);

// Get tasks by project
router.get("/project/:projectId", getTasksByProject);

// Get, update, delete single task
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;