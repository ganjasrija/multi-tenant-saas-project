import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  getTenantDetails,
  updateTenant,
  listAllTenants,
} from "../controllers/tenantController.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

/* API 7: LIST ALL TENANTS */
router.get(
  "/",
  authMiddleware,
  authorizeRoles("super_admin"),
  listAllTenants
);

/* API 5: GET TENANT DETAILS */
router.get(
  "/:tenantId",
  authMiddleware,
  authorizeRoles("super_admin", "tenant_admin", "user"),
  getTenantDetails
);

/* API 6: UPDATE TENANT */
router.put(
  "/:tenantId",
  authMiddleware,
  authorizeRoles("super_admin", "tenant_admin"),
  updateTenant
);

/* 🔥 USER ROUTES (API 8, API 9) */
router.use("/", userRoutes);

export default router;
