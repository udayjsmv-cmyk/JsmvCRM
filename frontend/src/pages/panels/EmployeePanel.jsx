// src/pages/panels/EmployeePanel.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#FF6666",
  "#00CC99",
  "#FFCC00",
];

// Helper to count chart data
const countBy = (arr, key) => {
  const map = {};
  arr.forEach((x) => {
    const v = x[key] || "Unknown";
    map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

export default function EmployeePanel({ getUser }) {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [divisionData, setDivisionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // 🔹 Load user from prop or localStorage
  useEffect(() => {
    const fetchUser = async () => {
      let u = null;

      // Try getUser function first
      try {
        u = typeof getUser === "function" ? await getUser() : null;
      } catch (e) {
        console.warn("getUser() threw:", e);
      }

      // Fallback to localStorage
      if (!u) {
        try {
          const raw = localStorage.getItem("user");
          u = raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.warn("localStorage parsing failed:", e);
        }
      }

      setUser(u);
    };

    fetchUser();
  }, [getUser]);

  // 🔹 Fetch leads for this employee
  const fetchLeads = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/clients/my");
      const data = Array.isArray(res.data) ? res.data : [];

      if (!data.length) {
        console.warn("No leads returned for this employee");
      }

      const normalized = data.map((l) => ({
        _id: l._id,
        clientName: l.clientName || l.ClientName || "-",
        email: l.email || l.Email || "-",
        contactNo: l.contactNo || l.ContactNo || l.contact || "-",
        status: (l.status || "pending").toLowerCase(),
        priority: (l.priority || "MEDIUM").toUpperCase(),
        division: l.division || "ColdCalling",
        remarks: l.notes || l.remarks || "-",
        updatedAt: l.updatedAt || l.createdAt,
      }));

      const sorted = normalized.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      setLeads(sorted);
      setStatusData(countBy(sorted, "status"));
      setPriorityData(countBy(sorted, "priority"));
      setDivisionData(countBy(sorted, "division"));
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("EmployeePanel fetchLeads error:", err);
      const msg =
        err?.response?.data?.message || err.message || "Failed to load leads";
      setError(msg);
      setLeads([]);
      setStatusData([]);
      setPriorityData([]);
      setDivisionData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads after user loads
  useEffect(() => {
    if (user && user.email) fetchLeads();
  }, [user]);

  const refresh = () => fetchLeads();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-blue-700">My Leads Dashboard</h2>
        <div className="flex gap-3 items-center flex-wrap">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Loading your leads...</p>
      ) : leads.length === 0 ? (
        <p className="text-gray-600">No assigned leads yet.</p>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[
              { title: "Status Distribution", data: statusData },
              { title: "Priority Distribution", data: priorityData },
              { title: "Division Distribution", data: divisionData },
            ].map((chart, idx) => (
              <div key={idx} className="p-4 border rounded shadow bg-white">
                <h3 className="mb-2 font-semibold">{chart.title}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {chart.data.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Recent Leads */}
          <div className="mt-6 p-4 border rounded shadow bg-white overflow-x-auto">
            <h3 className="mb-2 font-semibold">Recent Leads</h3>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Client Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Contact No</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Priority</th>
                  <th className="border px-4 py-2">Division</th>
                  <th className="border px-4 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 10).map((l, i) => (
                  <tr key={l._id || i} className="hover:bg-gray-50 transition">
                    <td className="border px-4 py-2">{l.clientName}</td>
                    <td className="border px-4 py-2">{l.email}</td>
                    <td className="border px-4 py-2">{l.contactNo}</td>
                    <td className="border px-4 py-2 capitalize">{l.status}</td>
                    <td className="border px-4 py-2">{l.priority}</td>
                    <td className="border px-4 py-2">{l.division}</td>
                    <td className="border px-4 py-2">{l.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
