import pool from "../config/db.js";
import bcrypt from "bcrypt";
import logAudit from "../utils/auditLogger.js";

/* =========================
   API 8: ADD USER TO TENANT
   ========================= */
export const addUserToTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { role, tenantId: adminTenantId, userId } = req.user;
    const { email, password, fullName, role: newRole } = req.body;

    // Only tenant_admin allowed
    if (role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin can add users",
      });
    }

    // Must be same tenant
    if (tenantId !== adminTenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized tenant access",
      });
    }

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check tenant user limit
    const tenantResult = await pool.query(
      "SELECT max_users FROM tenants WHERE id = $1",
      [tenantId]
    );

    const maxUsers = tenantResult.rows[0].max_users;

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    if (Number(countResult.rows[0].count) >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: "User limit reached",
      });
    }

    // Email unique per tenant
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2",
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (id, tenant_id, email, password_hash, full_name, role, is_active, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW())
      RETURNING id, email, full_name, role, tenant_id, is_active, created_at
      `,
      [
        tenantId,
        email,
        hashedPassword,
        fullName,
        newRole || "user",
      ]
    );

    await logAudit({
      tenantId,
      userId,
      action: "CREATE_USER",
      entityType: "user",
      entityId: result.rows[0].id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        role: result.rows[0].role,
        tenantId: result.rows[0].tenant_id,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 9: LIST TENANT USERS
   ========================= */
export const listTenantUsers = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role } = req.user;

    if (role !== "super_admin" && tenantId !== userTenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const result = await pool.query(
      `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        users: result.rows.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 10: UPDATE USER
   ========================= */
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { userId: loggedInUserId, tenantId, role: loggedRole } = req.user;

    // Fetch user
    const userResult = await pool.query(
      "SELECT id, tenant_id FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const targetUser = userResult.rows[0];

    // Same tenant check
    if (targetUser.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Self update allowed only for fullName
    if (loggedInUserId === userId && (role || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: "Cannot change role or status",
      });
    }

    // Only tenant_admin can change role/status
    if (loggedRole !== "tenant_admin" && (role || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin allowed",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, full_name, role, updated_at
      `,
      [fullName, role, isActive, userId]
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id: result.rows[0].id,
        fullName: result.rows[0].full_name,
        role: result.rows[0].role,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 11: DELETE USER
   ========================= */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { userId: loggedInUserId, tenantId, role } = req.user;

    if (role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin allowed",
      });
    }

    if (userId === loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete yourself",
      });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND tenant_id = $2",
      [userId, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

