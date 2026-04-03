import React, { useEffect, useState } from "react";
import axios from "axios";
import { getUser } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Employees = () => {
  const currentUser = getUser();

  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    email: "",
    password: "",
    department: "CallingDepartment",
    role: "employee",
    teamName: "",
  });

  // ✅ Fetch employees from backend
  useEffect(() => {
   const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated. Please login again.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE}/clients/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure response is always an array
        const data = Array.isArray(res.data) ? res.data : [];
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(err.response?.data?.message || "Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);
  // ✅ Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Reset form
  const resetForm = () => {
    setForm({
      FirstName: "",
      LastName: "",
      email: "",
      password: "",
      department: "CallingDepartment",
      role: "employee",
      teamName: "",
    });
  };

  // ✅ Toggle Form Visibility
  const toggleForm = () => {
    if (showForm) resetForm();
    setShowForm(!showForm);
  };

  // ✅ Handle registration using backend /api/auth/register
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.FirstName || !form.LastName || !form.email || !form.password) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // enforce creation permissions
      if (currentUser.role === "admin" && form.role !== "manager") {
        alert("Admin can only create managers.");
        return;
      }

      if (currentUser.role === "manager" && !["teamlead", "employee","preparer","reviewer","filer","corrections"].includes(form.role)) {
        alert("Manager can only create team leads or employees.");
        return;
      }

      const payload = {
        ...form,
        department: form.department,
        role: form.role,
      };

      // Add manager/teamlead info automatically
      if (currentUser.role === "manager") {
        payload.managerId = currentUser.id;
      }
      if (currentUser.role === "teamlead") {
        payload.teamleadId = currentUser.id;
        payload.managerId = currentUser.managerId;
        payload.teamName = currentUser.teamName;
      }

      const res = await axios.post(`${API_BASE}/auth/register`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newUser = res.data?.user;
      if (newUser) {
        setEmployees((prev) => [newUser, ...prev]);
        alert("Employee registered successfully!");
        resetForm();
        setShowForm(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert(err.response?.data?.message || "Error registering user");
    }
  };

  // ✅ Access Restriction UI
  if (!["admin", "manager"].includes(currentUser.role)) {
    return (
      <p className="text-red-600 font-semibold mt-4">
        Only admin or manager can manage employees.
      </p>
    );
  }

  return (
    <div className="p-8 bg-[var(--bg)] rounded-2xl shadow-md text-[var(--text)] border border-[var(--accent)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text)]">Manage Employees</h1>

      <button
        onClick={toggleForm}
        className="mb-6 text-white font-semibold px-5 py-2 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.6)]"
        style={{
          background: "linear-gradient(135deg, #006989, #00B4D8, #7F00FF)",
          backgroundSize: "300% 300%",
          animation: "gradientShift 6s ease infinite",
        }}
      >
        {showForm ? "Cancel" : "Add New User"}
      </button>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Form */}
      {showForm && (
              <form
        onSubmit={handleSubmit}
        className="mb-8 bg-white p-6 rounded-xl shadow-inner border border-[var(--accent)]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* First Name */}
          <label className="block">
            <span className="font-medium">First Name</span>
            <input
              type="text"
              name="FirstName"
              value={form.FirstName}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            />
          </label>

          {/* Last Name */}
          <label className="block">
            <span className="font-medium">Last Name</span>
            <input
              type="text"
              name="LastName"
              value={form.LastName}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            />
          </label>

          {/* Email */}
          <label className="block">
            <span className="font-medium">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            />
          </label>

          {/* Password */}
          <label className="block">
            <span className="font-medium">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            />
          </label>

          {/* Department */}
          {currentUser.role =="admin"?(<>
               <label className="block">
            <span className="font-medium">Department</span>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            >
              <option value="">--Select Department--</option>
                  <option value="Administration">Administration</option>
                  
            </select>
          </label>
          </>):(
             <label className="block">
            <span className="font-medium">Department</span>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            >
              <option value="">--Select Department--</option>
                  <option value="CallingDepartment">Calling</option>
                  <option value="PreparationDepartment">Preparation</option>
                  
            </select>
          </label>
          )}

          {/* Role (depends on department) */}
          <label className="block">
            <span className="font-medium">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded w-full mt-1"
            >
              <option value="">--Select Role--</option>
              {currentUser.role === "admin" ? (
                <>
                <option value="manager">Manager</option>
                </>
              ) : form.department === "CallingDepartment" ? (
                <>
                  <option value="teamlead">Team Lead</option>
                  <option value="employee">Employee</option>
                </>
              ) : form.department === "PreparationDepartment" ? (
                <>
                  <option value="preparer">Preparer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="filer">Filer</option>
                  <option value="corrections">Corrections</option>
                </>
              ) : null}
            </select>
          </label>

          {/* Team Name (only for Calling Department) */}
          {currentUser.role !== "admin" && form.department === "CallingDepartment" && (
            <label className="block">
              <span className="font-medium">Team Name</span>
              <select
                name="teamName"
                value={form.teamName}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full mt-1"
              >
                <option value="">--Select Team--</option>
                <option value="RainBow Tax Filings">RainBow Tax Filings</option>
                <option value="On Time Tax Filings">On Time Tax Filings</option>
                <option value="GrandTax Filings">GrandTax Filings</option>
                <option value="TaxFilerWay">TaxFilerWay</option>
              </select>
            </label>
          )}
        </div>

        <button
          type="submit"
          className="mt-6 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]"
          style={{
            background: "linear-gradient(135deg, #006989, #00B4D8, #7F00FF)",
            backgroundSize: "300% 300%",
            animation: "gradientShift 6s ease infinite",
          }}
        >
          Register
        </button>
      </form>

      )}

      {/* Employee Table */}
      <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Employee List
      </h2>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-700 border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">First Name</th>
              <th className="px-4 py-2">Last Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-4 py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <tr
                key={emp._id || i}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{emp.FirstName || emp.name || "-"}</td>
                <td className="px-4 py-2">{emp.LastName || "-"}</td>
                <td className="px-4 py-2">{emp.email}</td>
                <td className="px-4 py-2 capitalize">{emp.role}</td>
                <td className="px-4 py-2">{emp.department || "-"}</td>
                <td className="px-4 py-2">{emp.teamName || "—"}</td>
                <td className="px-4 py-2">
                  {emp.updatedAt
                    ? new Date(emp.updatedAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Employees;
