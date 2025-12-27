import express from "express";
import {
  registerTenant,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register-tenant", registerTenant);
router.post("/login", loginUser);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logoutUser);

export default router;
