import { useState, useEffect } from "react";
import api from "../services/api";

const ProjectModal = ({ isOpen, onClose, onSuccess, project }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "active");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);

      if (project) {
        // ✅ EDIT - Better error handling
        await api.put(`/api/projects/${project.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          status: status,
        });
      } else {
        // ✅ CREATE
        await api.post("/api/projects", {
          name: name.trim(),
          description: description.trim() || null,
          status: status,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      // ✅ SHOW ACTUAL ERROR
      console.error("API ERROR:", err.response?.data || err);
      setError(err.response?.data?.message || err.response?.statusText || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>{project ? "Edit Project" : "Create New Project"}</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        {error && (
          <div style={errorStyle}>
            ❌ <strong>{error}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label>Project Name <span style={{color: 'red'}}>*</span></label>
            <input
              style={inputStyle}
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={fieldStyle}>
            <label>Description (optional)</label>
            <textarea
              style={textareaStyle}
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              disabled={loading}
            />
          </div>

          <div style={fieldStyle}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle} disabled={loading}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={buttonsStyle}>
            <button type="button" onClick={onClose} style={cancelStyle} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} style={saveStyle(loading || !name.trim())}>
              {loading ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ STYLES (unchanged from your version)
const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
};

const modalStyle = {
  background: "#fff", padding: "30px", borderRadius: "12px", width: "90%", maxWidth: "500px",
  maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
};

const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const closeButtonStyle = { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" };
const fieldStyle = { marginBottom: "20px" };
const inputStyle = { width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" };
const textareaStyle = { ...inputStyle, minHeight: "80px", resize: "vertical" };
const buttonsStyle = { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" };
const cancelStyle = { padding: "12px 24px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const saveStyle = (disabled) => ({
  padding: "12px 24px", background: disabled ? "#ccc" : "#28a745", color: "white", 
  border: "none", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer"
});
const errorStyle = { background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "6px", marginBottom: "15px" };

export default ProjectModal;
