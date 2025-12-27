import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSubdomain, setTenantSubdomain] = useState("");
  const [error, setError] = useState("");


  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");


    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        tenantSubdomain,
      });


      localStorage.setItem("token", res.data.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };


  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>


      {error && <p style={{ color: "red" }}>{error}</p>}


      <form onSubmit={handleLogin}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br /><br />


        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br /><br />


        <input placeholder="Tenant Subdomain" value={tenantSubdomain} onChange={(e) => setTenantSubdomain(e.target.value)} />
        <br /><br />


        <button type="submit">Login</button>
      </form>


      <p>
        New tenant? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};


export default Login;