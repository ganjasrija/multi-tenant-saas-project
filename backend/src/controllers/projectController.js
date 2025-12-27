import pool from "../config/db.js";
import logAudit from "../utils/auditLogger.js";

/* =========================
   API 12: CREATE PROJECT
   ========================= */
export const createProject = async (req, res, next) => {
  try {
    const { name, description, status = "active" } = req.body;
    const { tenantId, userId } = req.user;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    // Check project limit
    const limitResult = await pool.query(
      "SELECT max_projects FROM tenants WHERE id = $1",
      [tenantId]
    );

    const maxProjects = limitResult.rows[0].max_projects;

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM projects WHERE tenant_id = $1",
      [tenantId]
    );

    if (Number(countResult.rows[0].count) >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: "Project limit reached",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO projects
      (id, tenant_id, name, description, status, created_by, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [tenantId, name, description, status, userId]
    );

    await logAudit({
      tenantId,
      userId,
      action: "CREATE_PROJECT",
      entityType: "project",
      entityId: result.rows[0].id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        tenantId,
        name: result.rows[0].name,
        description: result.rows[0].description,
        status: result.rows[0].status,
        createdBy: userId,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 13: LIST PROJECTS
   ========================= */
export const listProjects = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { status, search } = req.query;

    let conditions = ["p.tenant_id = $1"];
    let values = [tenantId];
    let index = 2;

    if (status) {
      conditions.push(`p.status = $${index++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`LOWER(p.name) LIKE $${index++}`);
      values.push(`%${search.toLowerCase()}%`);
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        u.id AS creator_id,
        u.full_name AS creator_name,
        COUNT(t.id) AS task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_task_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ${conditions.join(" AND ")}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      `,
      values
    );

    res.status(200).json({
      success: true,
      data: {
        projects: result.rows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          createdBy: {
            id: p.creator_id,
            fullName: p.creator_name,
          },
          taskCount: Number(p.task_count),
          completedTaskCount: Number(p.completed_task_count),
          createdAt: p.created_at,
        })),
        total: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 14: UPDATE PROJECT
   ========================= */
export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;
    const { name, description, status } = req.body;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND tenant_id = $2",
      [projectId, tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const result = await pool.query(
      `
      UPDATE projects
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [name, description, status, projectId]
    );

    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   API 15: DELETE PROJECT
   ========================= */
export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND tenant_id = $2",
      [projectId, tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);

    await logAudit({
      tenantId,
      userId,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    
    const result = await pool.query(
      `SELECT p.*, u.full_name as "createdBy.fullName"
       FROM projects p 
       JOIN users u ON p.created_by = u.id 
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
