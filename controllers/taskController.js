const Task = require("../models/Task");

// Create Task
const createTask = async (req, res) => {
    try {
        const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

        const task = await Task.create({
            title,
            description,
            projectId,
            assignedTo,
            priority,
            dueDate,
            createdBy: req.user.id,
            status: "Pending",
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};

// Get Tasks by Project
const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const tasks = await Task.find({ projectId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Get Single Task
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Update Task
// Update Task (Role-based)
const updateTask = async (req, res) => {
    try {
        const { title, description, status, priority, assignedTo, dueDate } = req.body;
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // RULE 1: Only Admin can reassign tasks to different people
        if (assignedTo && assignedTo !== task.assignedTo.toString()) {
            if (req.user.role !== "Admin") {
                return res.status(403).json({
                    success: false,
                    message: "Only Admin can reassign tasks to different users",
                });
            }
        }

        // RULE 2: Members can only update their own tasks
        if (req.user.role !== "Admin") {
            if (task.assignedTo.toString() !== req.user.id && task.createdBy.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update tasks assigned to you",
                });
            }
        }

        // RULE 3: Members can only update status, not other fields
        if (req.user.role !== "Admin") {
            // Members can only change status
            const updatedTask = await Task.findByIdAndUpdate(
                req.params.id,
                { status },  // Only update status
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: "Task status updated successfully",
                task: updatedTask,
            });
        }

        // Admin can update everything
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { title, description, status, priority, assignedTo, dueDate },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Delete Task
// Delete Task (Admin or Creator only)
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Check if user is creator OR Admin
        if (task.createdBy.toString() !== req.user.id && req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "You can only delete tasks you created",
            });
        }

        await task.deleteOne();

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Get User Tasks
const getUserTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id })
            .sort({ dueDate: 1, priority: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Accept Task
const acceptTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Check if task is assigned to this user
        if (task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "This task is not assigned to you",
            });
        }

        // Check if task is still pending
        if (task.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Task is already ${task.status}. Cannot accept now.`,
            });
        }

        task.status = "Accepted";
        task.acceptedAt = new Date();
        await task.save();

        res.status(200).json({
            success: true,
            message: "Task accepted successfully",
            task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Reject Task
const rejectTask = async (req, res) => {
    try {
        const { reason } = req.body;
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Check if task is assigned to this user
        if (task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "This task is not assigned to you",
            });
        }

        // Check if task is still pending
        if (task.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Task is already ${task.status}. Cannot reject now.`,
            });
        }

        task.status = "Rejected";
        task.rejectionReason = reason || "No reason provided";
        await task.save();

        res.status(200).json({
            success: true,
            message: "Task rejected",
            task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Get tasks assigned to me (for workers)
const getMyAssignedTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Get pending tasks (needs acceptance)
const getPendingTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ 
            assignedTo: req.user.id,
            status: "Pending"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};



module.exports = {
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
};