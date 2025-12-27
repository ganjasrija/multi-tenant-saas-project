import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });


  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");


  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // 1️⃣ Current user
        const meRes = await api.get("/auth/me");
        const currentUserId = meRes.data.data.id;


        // 2️⃣ Projects
        const projectsRes = await api.get("/projects");
        const projectsData = projectsRes.data.data.projects;
        setProjects(projectsData.slice(0, 5)); // recent 5


        let totalTasks = 0;
        let completedTasks = 0;
        let assignedTasks = [];


        // 3️⃣ Tasks per project
        for (const project of projectsData) {
          const tasksRes = await api.get(
            `/projects/${project.id}/tasks`
          );


          const tasks = tasksRes.data.data.tasks;
          totalTasks += tasks.length;
          completedTasks += tasks.filter(t => t.status === "completed").length;


          // My tasks
          assignedTasks.push(
            ...tasks
              .filter(t => t.assignedTo === currentUserId)
              .map(t => ({ ...t, projectName: project.name }))
          );
        }


        setStats({
          totalProjects: projectsData.length,
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
        });


        setMyTasks(assignedTasks);
      } catch (err) {
        setError("Failed to load dashboard data");
      }
    };


    loadDashboard();
  }, []);


  const filteredTasks =
    statusFilter === "all"
      ? myTasks
      : myTasks.filter(t => t.status === statusFilter);


  return (
    <>
      <Navbar />


      <div style={{ padding: "40px" }}>
        <h1>Dashboard</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}


        {/* STATS */}
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <StatCard title="Total Projects" value={stats.totalProjects} />
          <StatCard title="Total Tasks" value={stats.totalTasks} />
          <StatCard title="Completed Tasks" value={stats.completedTasks} />
          <StatCard title="Pending Tasks" value={stats.pendingTasks} />
        </div>


        {/* RECENT PROJECTS */}
        <h2 style={{ marginTop: "40px" }}>Recent Projects</h2>
        {projects.map(p => (
          <div key={p.id} style={{ borderBottom: "1px solid #ddd", padding: "10px 0" }}>
            <strong>{p.name}</strong> — Status: {p.status}
          </div>
        ))}


        {/* MY TASKS */}
        <h2 style={{ marginTop: "40px" }}>My Tasks</h2>


        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>


        {filteredTasks.length === 0 && <p>No tasks assigned</p>}


        {filteredTasks.map(task => (
          <div
            key={task.id}
            style={{ border: "1px solid #ccc", marginTop: "10px", padding: "10px" }}
          >
            <strong>{task.title}</strong>
            <p>Project: {task.projectName}</p>
            <p>Priority: {task.priority}</p>
            <p>Due Date: {task.dueDate || "N/A"}</p>
            <p>Status: {task.status}</p>
          </div>
        ))}
      </div>
    </>
  );
};


const StatCard = ({ title, value }) => (
  <div
    style={{
      border: "1px solid #ccc",
      padding: "20px",
      borderRadius: "8px",
      width: "200px",
      textAlign: "center",
    }}
  >
    <h3>{title}</h3>
    <h2>{value}</h2>
  </div>
);


export default Dashboard;