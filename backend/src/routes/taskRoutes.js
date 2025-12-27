import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createTask,
  listProjectTasks,
  updateTaskStatus,
  updateTask,
} from "../controllers/taskController.js";

const router = express.Router();

// API 16
router.post("/projects/:projectId/tasks", authMiddleware, createTask);

// API 17
router.get("/projects/:projectId/tasks", authMiddleware, listProjectTasks);

// API 18
router.patch("/tasks/:taskId/status", authMiddleware, updateTaskStatus);

// API 19
router.put("/tasks/:taskId", authMiddleware, updateTask);

export default router;
