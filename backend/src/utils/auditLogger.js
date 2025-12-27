import pool from "../config/db.js";

const logAudit = async ({
  tenantId = null,
  userId = null,
  action,
  entityType,
  entityId = null,
  ipAddress = null,
}) => {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs
      (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      `,
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};

export default logAudit;
