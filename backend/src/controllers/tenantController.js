import pool from "../config/db.js";
import logAudit from "../utils/auditLogger.js";


export const getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { role, tenantId: userTenantId } = req.user;

    // Authorization:
    // tenant_admin/user → only own tenant
    // super_admin → any tenant
    if (role !== "super_admin" && userTenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to tenant",
      });
    }

    // Fetch tenant
    const tenantResult = await pool.query(
      `
      SELECT id, name, subdomain, status, subscription_plan,
             max_users, max_projects, created_at
      FROM tenants
      WHERE id = $1
      `,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Stats
    const usersCount = await pool.query(
      "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    const projectsCount = await pool.query(
      "SELECT COUNT(*) FROM projects WHERE tenant_id = $1",
      [tenantId]
    );

    const tasksCount = await pool.query(
      "SELECT COUNT(*) FROM tasks WHERE tenant_id = $1",
      [tenantId]
    );

    const tenant = tenantResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: Number(usersCount.rows[0].count),
          totalProjects: Number(projectsCount.rows[0].count),
          totalTasks: Number(tasksCount.rows[0].count),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};



export const updateTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { role, tenantId: userTenantId, userId } = req.user;

    const {
      name,
      status,
      subscriptionPlan,
      maxUsers,
      maxProjects,
    } = req.body;

    // tenant_admin can only update name
    if (role === "tenant_admin") {
      if (status || subscriptionPlan || maxUsers || maxProjects) {
        return res.status(403).json({
          success: false,
          message: "Tenant admin can only update name",
        });
      }

      if (userTenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized tenant access",
        });
      }
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let index = 1;

    if (name) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (role === "super_admin") {
      if (status) {
        fields.push(`status = $${index++}`);
        values.push(status);
      }
      if (subscriptionPlan) {
        fields.push(`subscription_plan = $${index++}`);
        values.push(subscriptionPlan);
      }
      if (maxUsers) {
        fields.push(`max_users = $${index++}`);
        values.push(maxUsers);
      }
      if (maxProjects) {
        fields.push(`max_projects = $${index++}`);
        values.push(maxProjects);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    values.push(tenantId);

    const result = await pool.query(
      `
      UPDATE tenants
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING id, name, updated_at
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Audit log
    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_TENANT",
      entityType: "tenant",
      entityId: tenantId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listAllTenants = async (req, res, next) => {
  try {
    const { role } = req.user;

    // Only super_admin allowed
    if (role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin only",
      });
    }

    // Query params
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const { status, subscriptionPlan } = req.query;

    // Filters
    const conditions = [];
    const values = [];
    let index = 1;

    if (status) {
      conditions.push(`t.status = $${index++}`);
      values.push(status);
    }

    if (subscriptionPlan) {
      conditions.push(`t.subscription_plan = $${index++}`);
      values.push(subscriptionPlan);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get tenants with counts
    const tenantsQuery = `
      SELECT
        t.id,
        t.name,
        t.subdomain,
        t.status,
        t.subscription_plan,
        t.created_at,
        COUNT(DISTINCT u.id) AS total_users,
        COUNT(DISTINCT p.id) AS total_projects
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN projects p ON p.tenant_id = t.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${index++} OFFSET $${index++}
    `;

    const tenantsResult = await pool.query(tenantsQuery, [
      ...values,
      limit,
      offset,
    ]);

    // Total count (for pagination)
    const countQuery = `
      SELECT COUNT(*) FROM tenants t
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const totalTenants = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTenants / limit);

    res.status(200).json({
      success: true,
      data: {
        tenants: tenantsResult.rows.map((t) => ({
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          status: t.status,
          subscriptionPlan: t.subscription_plan,
          totalUsers: Number(t.total_users),
          totalProjects: Number(t.total_projects),
          createdAt: t.created_at,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalTenants,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
