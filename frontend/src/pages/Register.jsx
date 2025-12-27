import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";


const Register = () => {
  const navigate = useNavigate();


  const [form, setForm] = useState({
    tenantName: "",
    subdomain: "",
    adminEmail: "",
    adminFullName: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });


  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");


    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }


    if (!form.terms) {
      return setError("Please accept terms & conditions");
    }


    try {
      await api.post("/auth/register-tenant", {
        tenantName: form.tenantName,
        subdomain: form.subdomain,
        adminEmail: form.adminEmail,
        adminPassword: form.password,
        adminFullName: form.adminFullName,
      });


      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };


  return (
    <div style={{ padding: "40px" }}>
      <h2>Tenant Registration</h2>


      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}


      <form onSubmit={handleSubmit}>
        <input name="tenantName" placeholder="Organization Name" onChange={handleChange} />
        <br /><br />


        <input name="subdomain" placeholder="Subdomain" onChange={handleChange} />
        <small>{form.subdomain && `${form.subdomain}.yourapp.com`}</small>
        <br /><br />


        <input name="adminEmail" placeholder="Admin Email" onChange={handleChange} />
        <br /><br />


        <input name="adminFullName" placeholder="Admin Full Name" onChange={handleChange} />
        <br /><br />


        <input type="password" name="password" placeholder="Password" onChange={handleChange} />
        <br /><br />


        <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} />
        <br /><br />


        <label>
          <input type="checkbox" name="terms" onChange={handleChange} /> Accept Terms
        </label>
        <br /><br />


        <button type="submit">Register</button>
      </form>


      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};


export default Register;