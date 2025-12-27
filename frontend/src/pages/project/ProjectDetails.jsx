import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";


const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();


  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadProject();
  }, []);


  const loadProject = async () => {
    try {
      setLoading(true);


      // ✅ Project
      const projectRes = await api.get(`/projects/${projectId}`);
      setProject(projectRes.data.data);


      // ✅ Tasks
      const tasksRes = await api.get(`/projects/${projectId}/tasks`);
      setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      setError("Project not found or access denied");
    } finally {
      setLoading(false);
    }
  };


  // ✅ STATES HANDLING
  if (loading) return <p style={{ padding: "40px" }}>Loading...</p>;


  if (error)
    return (
      <div style={{ padding: "40px" }}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/projects")}>
          Back to Projects
        </button>
      </div>
    );


  return (
    <>
      <Navbar />


      <div style={{ padding: "40px" }}>
        {/* PROJECT HEADER */}
        <h1>{project.name}</h1>
        <p>{project.description}</p>
        <strong>Status:</strong> {project.status}


        <hr style={{ margin: "20px 0" }} />


        {/* TASKS */}
        <h2>Tasks</h2>


        {tasks.length === 0 && <p>No tasks yet</p>}


        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            <h4>{task.title}</h4>
            <p>Status: {task.status}</p>
            <p>Priority: {task.priority}</p>
            {task.assignedTo && (
              <p>Assigned To: {task.assignedTo.fullName}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
};


export default ProjectDetails;