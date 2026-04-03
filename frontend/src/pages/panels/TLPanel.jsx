import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#8884D8", "#FF6666", "#00CC99", "#FFCC00",
];

const countBy = (arr, key) => {
  const map = {};
  arr.forEach((x) => {
    const v = x[key] || "Unknown";
    map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

export default function TeamLeadPanel({ getUser }) {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [divisionData, setDivisionData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      let u = null;
      try {
        u = typeof getUser === "function" ? await getUser() : null;
      } catch {}

      if (!u) {
        try {
          const raw = localStorage.getItem("user");
          u = raw ? JSON.parse(raw) : null;
        } catch {}
      }

      setUser(u);
    };

    fetchUser();
  }, [getUser]);

  const fetchLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/clients");
      let data = Array.isArray(res.data) ? res.data : [];

      // ✅ FILTER TEAM DATA
      data = data.filter((c) => c.teamName === user?.teamName);

      const normalized = data.map((l) => ({
        _id: l._id,
        clientName: l.clientName || "-",
        email: l.email || "-",
        contactNo: l.contactNo || "-",
        division: l.division || "ColdCalling",
        priority: (l.priority || "MEDIUM").toUpperCase(),
        status: (l.status || "pending").toLowerCase(),
        assignedTo: l.assignedTo
          ? `${l.assignedTo.FirstName || ""} ${l.assignedTo.LastName || ""}`.trim()
          : "Unassigned",
        updatedAt: l.updatedAt || l.createdAt,
      }));

      setLeads(normalized);
      setDivisionData(countBy(normalized, "division"));
      setStatusData(countBy(normalized, "status"));
      setPriorityData(countBy(normalized, "priority"));
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error(err);
      setError("Failed to load leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const res = await api.get("/clients/employee-lead-counts");

      const empStats = (res.data || [])
        .filter((e) => e.teamName === user?.teamName)
        .map((e) => ({
          employee: e.name || "Unknown",
          leads: e.leadCount || 0,
        }));

      setEmployeeStats(empStats);
    } catch (err) {
      console.error(err);
      setEmployeeStats([]);
    }
  };

  useEffect(() => {
    if (user?.role === "teamlead") {
      fetchLeads();
      fetchEmployeeStats();
    }
  }, [user]);

  const refresh = () => {
    fetchLeads();
    fetchEmployeeStats();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-blue-700">
          Team Lead Dashboard — {user?.teamName}
        </h2>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </span>
          )}

          <button
            onClick={refresh}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[divisionData, statusData, priorityData].map((data, i) => (
              <div key={i} className="p-4 border rounded bg-white shadow">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
                      {data.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div className="p-4 border rounded bg-white shadow mb-6">
            <h3 className="mb-3 font-semibold">Leads by Employee</h3>

            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Employee</th>
                  <th className="border px-4 py-2">Leads</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((e, idx) => (
                  <tr key={idx}>
                    <td className="border px-4 py-2">{e.employee}</td>
                    <td className="border px-4 py-2 text-center">{e.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border rounded bg-white shadow overflow-x-auto">
            <h3 className="mb-3 font-semibold">Recent Leads</h3>

            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Client</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Contact</th>
                  <th className="border px-4 py-2">Division</th>
                  <th className="border px-4 py-2">Priority</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 15).map((l) => (
                  <tr key={l._id}>
                    <td className="border px-4 py-2">{l.clientName}</td>
                    <td className="border px-4 py-2">{l.email}</td>
                    <td className="border px-4 py-2">{l.contactNo}</td>
                    <td className="border px-4 py-2">{l.division}</td>
                    <td className="border px-4 py-2">{l.priority}</td>
                    <td className="border px-4 py-2">{l.status}</td>
                    <td className="border px-4 py-2">{l.assignedTo}</td>
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
