// src/components/ClientLeadModal.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import DocumentsTab from "./DocumentsTab";

const ClientLeadModal = ({ lead, onClose, reload, role }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCallLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clients/${lead._id}/call-log`);
      setCallLogs(res.data?.callLogs || []);
    } catch {
      setCallLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCallLogs();
  }, []);

  const [form, setForm] = useState({
    todayCallDate: "",
    callbackDate: "",
    callbackTime: "",
    remarks: "",
    comment: "",
    status: "in-progress",
    priority: lead.priority || "MEDIUM",
    timeZone: lead.timeZone || "EST",
  });

  const handleSave = async () => {
    try {
      await api.patch(`/clients/${lead._id}/call-log`, form);
      await loadCallLogs();
      reload();
      alert("Call log saved");
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{lead.clientName}</h2>
            <p className="text-sm text-gray-500">
              {lead.email} • {lead.contactNo}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-h-[80vh] overflow-y-auto">

          {/* Call History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Call History</h3>

            <div className="space-y-2 max-h-[280px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {loading && <p className="text-gray-500 text-sm">Loading...</p>}
              {!loading && callLogs.length === 0 && (
                <p className="text-gray-500 text-sm">No call logs</p>
              )}

              {callLogs.map((log, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border">
                  <div className="font-medium text-gray-800">{log.remarks || log.comment}</div>
                  <div className="font-medium text-bold-500">CallBackDate:{log.callbackDate}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.createdAt || log.updatedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    by {log.updatedBy?.FirstName || "Unknown"}
                  </div>
                </div>
              ))}
            </div>

            {/* Hide Add Call Log for Admin */}
            {role !== "admin" && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-gray-800">Add Call Log</h4>

                <div className="grid grid-cols-2 gap-3">
                    <label name="todayCallDate">todayCallDate
                  <input type="date" name="todayCallDate" className="input" 
                    value={form.todayCallDate}
                    onChange={e => setForm({...form, todayCallDate: e.target.value})}
                  />
                  </label>
                  <label name="callbackDate">callbackDate
                  <input type="date" className="input"
                    value={form.callbackDate}
                    onChange={e => setForm({...form, callbackDate: e.target.value})}
                  />
                  </label>
                   <select className="input"
                    value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value})}
                  >
                    <option value="">Priority</option>
                    {["LOW", "MEDIUM", "HIGH"].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <input type="time" className="input"
                    value={form.callbackTime}
                    onChange={e => setForm({...form, callbackTime: e.target.value})}
                  />
                  <input type="text" className="input" value={form.timeZone} onChange={e=>setForm({...form,timeZone:e.target.value})}></input>

                  <select className="input"
                    value={form.remarks}
                    onChange={e => setForm({...form, remarks: e.target.value})}
                  >
                    <option value="">Remarks</option>
                    {["Not Interested", "Call back", "FollowUp", "No answer", "Hang Up"].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>

                  <textarea className="col-span-2 input h-20"
                    placeholder="Comment"
                    value={form.comment}
                    onChange={e => setForm({...form, comment: e.target.value})}
                  />

                  <button 
                    onClick={handleSave}
                    className="col-span-2 bg-[#047857] hover:bg-[#065f46] text-white py-2 rounded-lg font-medium transition"
                  >
                    Save Call Log
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <DocumentsTab lead={lead} role={role} reload={reload} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLeadModal;
