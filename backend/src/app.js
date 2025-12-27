import express from "express";
import userRoutes from "./routes/userRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

import taskRoutes from "./routes/taskRoutes.js";

import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import errorHandler from "./middleware/errorHandler.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ ROUTES (THIS IS THE FIX)
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", userRoutes);
app.use("/api", userManagementRoutes);
app.use("/api", taskRoutes);




// error handler
app.use(errorHandler);

export default app;
