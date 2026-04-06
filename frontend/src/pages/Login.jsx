import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  // State to hold the masked password for display
  const [displayPassword, setDisplayPassword] = useState("");
  const maskTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      // Clear any previous timeout
      if (maskTimeoutRef.current) clearTimeout(maskTimeoutRef.current);

      // Update real password
      setForm((prev) => ({ ...prev, password: value }));

      // Show last character briefly
      const masked =
        "*".repeat(value.length - 1) + value.slice(-1); // mask all except last
      setDisplayPassword(masked);

      // After 500ms, mask last character too
      maskTimeoutRef.current = setTimeout(() => {
        setDisplayPassword("*".repeat(value.length));
      }, 500);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const { data } = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const roleRoutes = {
        admin: "/admin",
        manager: "/manager",
        teamlead: "/teamlead",
        employee: "/employee",
      };

      navigate(roleRoutes[user.role] || "/");
    } catch (err) {
      setStatus({
        loading: false,
        error:
          err.response?.data?.message ||
          err.message ||
          "Login failed",
      });
      return;
    }

    setStatus({ loading: false, error: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center text-blue-700 mb-6">
          ERP Login
        </h2>

        {status.error && (
          <p className="text-red-500 text-center mb-4">{status.error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="text" // type text to allow masking manually
            name="password"
            placeholder="Password"
            value={displayPassword}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {status.loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center font-semibold text-grey-800 py-2">
          @2026 ERP by UK
        </p>
      </div>
    </div>
  );
};

export default Login;
