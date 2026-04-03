import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [filters, setFilters] = useState({
    team: "",
    employee: "",
    status: "",
    search: "",
  });

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [filters, page]);

  // ===== FETCH CLIENTS =====
  const fetchClients = async () => {
    try {
      setLoading(true);

      const res = await api.get("/clients", {
        params: {
          ...filters,
          page,
          limit: 10,
        },
      });

      setClients(res.data.data);
      setPagination(res.data.pagination);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH EMPLOYEES =====
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/clients/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  };

  // ===== FILTER CHANGE =====
  const handleChange = (e) => {
    setPage(1);
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clients</h1>

      {/* 🔥 FILTERS */}
      <div className="flex flex-wrap gap-4 mb-4">

        {/* SEARCH */}
        <input
          type="text"
          name="search"
          placeholder="Search name or email"
          value={filters.search}
          onChange={handleChange}
          className="border px-3 py-1"
        />

        {/* TEAM */}
        <select name="team" onChange={handleChange}>
          <option value="">All Teams</option>
          <option value="RainBow Tax Filings">RainBow</option>
          <option value="On Time Tax Filings">On Time</option>
          <option value="GrandTax Filings">GrandTax</option>
          <option value="TaxFilerWay">TaxFilerWay</option>
        </select>

        {/* ✅ EMPLOYEE DROPDOWN */}
        <select name="employee" onChange={handleChange}>
          <option value="">All Employees</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.FirstName} {emp.LastName} ({emp.teamName || "No Team"})
            </option>
          ))}
        </select>

        {/* STATUS */}
        <select name="status" onChange={handleChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="w-full border">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Team</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c._id}>
                  <td>{c.clientName}</td>
                  <td>{c.email}</td>
                  <td>{c.contactNo}</td>
                  <td>{c.teamName}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex gap-3 mt-4">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Prev
            </button>

            <span>
              Page {pagination.page} / {pagination.totalPages}
            </span>

            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}