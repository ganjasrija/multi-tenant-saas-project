const tenantMiddleware = (req, res, next) => {
  // Super admin can access all tenants
  if (req.user && req.user.role === "super_admin") {
    return next();
  }

  // Normal users must have tenantId
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: "Tenant access denied",
    });
  }

  // Attach tenantId for controllers to use
  req.tenantId = req.user.tenantId;

  next();
};

export default tenantMiddleware;
