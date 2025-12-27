import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  addUserToTenant,
  listTenantUsers,
} from "../controllers/userController.js";

const router = express.Router();

// API 8: Add user
router.post(
  "/:tenantId/users",
  authMiddleware,
  authorizeRoles("tenant_admin"),
  addUserToTenant
);

// API 9: List users
router.get(
  "/:tenantId/users",
  authMiddleware,
  listTenantUsers
);

export default router;
