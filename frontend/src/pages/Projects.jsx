import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";


const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    loadProjects();
  }, [status]);


  const loadProjects = async () => {
    try {
      const params = {};
      if (status !== "all") params.status = status;


      const res = await api.get("/projects", { params });
      setProjects(res.data.data.projects);
    } catch {
      setError("Failed to load projects");
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    loadProjects();
  };


  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <>
      <Navbar />
      <div style={{ padding: "40px" }}>
        <h1>Projects</h1>


        {/* ACTION BAR */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
          <button>Create New Project</button>


          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>


          <input
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>


        {error && <p style={{ color: "red" }}>{error}</p>}


        {filtered.length === 0 && <p>No projects found</p>}


        {/* PROJECT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "20px" }}>
          {filtered.map(project => (
            <div
              key={project.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                borderRadius: "10px"
              }}
            >
              <h3>{project.name}</h3>
              <p>{project.description?.slice(0, 60)}...</p>


              <p><strong>Status:</strong> {project.status}</p>
              <p><strong>Tasks:</strong> {project.taskCount}</p>
              <p><strong>By:</strong> {project.createdBy?.fullName}</p>


              <div style={{ marginTop: "10px" }}>
                <button onClick={() => navigate(`/projects/${project.id}`)}>
                  View
                </button>{" "}
                <button>Edit</button>{" "}
                <button onClick={() => handleDelete(project.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};


export default Projects;