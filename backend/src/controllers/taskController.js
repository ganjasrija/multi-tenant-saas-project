import pool from "../config/db.js";
import logAudit from "../utils/auditLogger.js";

/* =========================
   API 16: CREATE TASK
========================= */
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { tenantId, userId } = req.user;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title required" });
    }

    // Check project belongs to tenant
    const projectRes = await pool.query(
      "SELECT tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (projectRes.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Validate assigned user
    if (assignedTo) {
      const userCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
        [assignedTo, tenantId]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Assigned user not in tenant",
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO tasks
      (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'todo', $5, $6, $7, NOW())
      RETURNING *
      `,
      [
        projectId,
        tenantId,
        title,
        description || null,
        priority || "medium",
        assignedTo || null,
        dueDate || null,
      ]
    );

    await logAudit({
      tenantId,
      userId,
      action: "CREATE_TASK",
      entityType: "task",
      entityId: result.rows[0].id,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/* =========================
   API 17: LIST PROJECT TASKS
========================= */
export const listProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    const projectRes = await pool.query(
      "SELECT tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (projectRes.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      `
      SELECT
        t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at,
        u.id AS user_id, u.full_name, u.email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
      ORDER BY t.priority DESC, t.due_date ASC
      `,
      [projectId]
    );

    res.json({
      success: true,
      data: {
        tasks: result.rows.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          priority: r.priority,
          assignedTo: r.user_id
            ? { id: r.user_id, fullName: r.full_name, email: r.email }
            : null,
          dueDate: r.due_date,
          createdAt: r.created_at,
        })),
        total: result.rows.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   API 18: UPDATE TASK STATUS
========================= */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;

    const result = await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, status, updated_at
      `,
      [status, taskId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/* =========================
   API 19: UPDATE TASK
========================= */
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { tenantId, userId } = req.user;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = $5,
        due_date = $6,
        updated_at = NOW()
      WHERE id = $7 AND tenant_id = $8
      RETURNING *
      `,
      [
        title,
        description,
        status,
        priority,
        assignedTo,
        dueDate,
        taskId,
        tenantId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_TASK",
      entityType: "task",
      entityId: taskId,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Task updated successfully", data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
