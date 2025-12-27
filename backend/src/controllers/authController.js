import pool from "../config/db.js";
import bcrypt from "bcrypt";
import logAudit from "../utils/auditLogger.js";
import jwt from "jsonwebtoken";

export const registerTenant = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const {
      tenantName,
      subdomain,
      adminEmail,
      adminPassword,
      adminFullName,
    } = req.body;

    if (
      !tenantName ||
      !subdomain ||
      !adminEmail ||
      !adminPassword ||
      !adminFullName
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingTenant = await pool.query(
      "SELECT id FROM tenants WHERE subdomain = $1",
      [subdomain]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Subdomain already exists",
      });
    }

    await client.query("BEGIN");

    const tenantResult = await client.query(
      `
      INSERT INTO tenants
      (id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'active', 'free', 5, 5, NOW(), NOW())
      RETURNING id, subdomain
      `,
      [tenantName, subdomain]
    );

    const tenantId = tenantResult.rows[0].id;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const userResult = await client.query(
      `
      INSERT INTO users
      (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'tenant_admin', true, NOW(), NOW())
      RETURNING id, email, full_name, role
      `,
      [tenantId, adminEmail, hashedPassword, adminFullName]
    );

    await client.query("COMMIT");

    await logAudit({
      tenantId,
      userId: userResult.rows[0].id,
      action: "CREATE_TENANT",
      entityType: "tenant",
      entityId: tenantId,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId,
        subdomain,
        adminUser: userResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};


export const loginUser = async (req, res, next) => {
  try {
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1️⃣ Get user first
    const userResult = await pool.query(
      `
      SELECT id, email, password_hash, full_name, role, tenant_id, is_active
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account inactive",
      });
    }

    // 2️⃣ Password check
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3️⃣ TENANT CHECK (ONLY if NOT super_admin)
    if (user.role !== "super_admin") {
      if (!tenantSubdomain) {
        return res.status(400).json({
          success: false,
          message: "Tenant subdomain is required",
        });
      }

      const tenantResult = await pool.query(
        `
        SELECT id, status FROM tenants
        WHERE subdomain = $1
        `,
        [tenantSubdomain]
      );

      if (tenantResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found",
        });
      }

      if (tenantResult.rows[0].status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tenant inactive",
        });
      }

      if (tenantResult.rows[0].id !== user.tenant_id) {
        return res.status(403).json({
          success: false,
          message: "User does not belong to this tenant",
        });
      }
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        },
        token,
        expiresIn: 86400,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getCurrentUser = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        t.id AS tenant_id,
        t.name AS tenant_name,
        t.subdomain,
        t.subscription_plan,
        t.max_users,
        t.max_projects
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND t.id = $2
      `,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: {
          id: user.tenant_id,
          name: user.tenant_name,
          subdomain: user.subdomain,
          subscriptionPlan: user.subscription_plan,
          maxUsers: user.max_users,
          maxProjects: user.max_projects,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const logoutUser = async (req, res) => {
  await logAudit({
    tenantId: req.user.tenantId,
    userId: req.user.userId,
    action: "LOGOUT",
    entityType: "user",
    entityId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};