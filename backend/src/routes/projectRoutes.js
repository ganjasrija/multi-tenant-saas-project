import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProjectById,  // ← ADD THIS IMPORT
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, listProjects);
router.get("/:id", authMiddleware, getProjectById);      // ← ADD THIS LINE!
router.put("/:id", authMiddleware, updateProject);       // Fixed param
router.delete("/:id", authMiddleware, deleteProject);    // Fixed param

export default router;
