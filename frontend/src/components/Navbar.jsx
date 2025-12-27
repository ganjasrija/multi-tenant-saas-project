import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";


const Navbar = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const loadUser = async () => {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
    };
    loadUser();
  }, []);


  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };


  if (!user) return null;


  return (
    <div style={{ display: "flex", padding: "15px 40px", borderBottom: "1px solid #ddd" }}>
      <h2 style={{ marginRight: "40px" }}>Multi-Tenant SaaS</h2>


      <nav style={{ flex: 1 }}>
        <Link to="/dashboard">Dashboard</Link>{" "}
        <Link to="/projects">Projects</Link>{" "}


        {(user.role === "tenant_admin" || user.role === "super_admin") && (
          <Link to="/tasks">Tasks</Link>
        )}{" "}


        {user.role === "tenant_admin" && (
          <Link to="/users">Users</Link>
        )}{" "}


        {user.role === "super_admin" && (
          <Link to="/tenants">Tenants</Link>
        )}
      </nav>


      <div style={{ position: "relative" }}>
        <span onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
          {user.fullName} ({user.role}) ▾
        </span>


        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <p>Profile</p>
            <p>Settings</p>
            <p onClick={logout} style={{ cursor: "pointer", color: "red" }}>
              Logout
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


export default Navbar;