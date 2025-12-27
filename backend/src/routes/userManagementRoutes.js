import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// API 10: Update user
router.put("/users/:userId", authMiddleware, updateUser);

// API 11: Delete user
router.delete("/users/:userId", authMiddleware, deleteUser);

export default router;
