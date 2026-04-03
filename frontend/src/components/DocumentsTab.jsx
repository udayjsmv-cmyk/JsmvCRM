// src/components/DocumentsTab.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { getUserRole } from "../utils/auth";

const FORWARDED_STATUSES = [
  "in-preparation",
  "forwarded-review",
  "under-review",
  "approved",
];

// documents considered "already forwarded" for badge/disable behavior
const isDocForwarded = (doc) => FORWARDED_STATUSES.includes(doc.status);

// statuses we allow employees/teamleads to forward (i.e. not already forwarded)
const canBeForwarded = (doc) => !isDocForwarded(doc) && (doc.status === "uploaded" || !doc.status);

const DocumentsTab = ({ lead, role, reload }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const userRole = role || getUserRole();

  // Fetch documents and apply client-side filters to avoid showing preparer-uploaded docs
  const fetchDocs = async () => {
    try {
      setLoading(true);
      let res;

      if (userRole === "preparer") {
        // preparer endpoint returns flattened clients/docs (server-side)
        res = await api.get("/files/forwarded");
      } else if (lead?._id) {
        res = await api.get(`/files/${lead._id}`);
      } else {
        setDocs([]);
        return;
      }

      // normalize result -> docs array
      let returned = Array.isArray(res.data) ? res.data : res.data.documents || res.data || [];

      // Remove documents uploaded by preparer from views for non-preparers
      if (userRole !== "preparer") {
        returned = returned.filter((d) => (d.uploadedByRole || d.uploadedBy?.role || "").toString() !== "preparer");
      }

      // For preparer view, show only docs that are meant for preparation (status in in-preparation / corrections / returned)
      if (userRole === "preparer") {
        returned = returned.filter((d) =>
          d.status
            ? FORWARDED_STATUSES.includes(d.status) || ["corrections", "returned"].includes(d.status)
            : false
        );
      }

      // Ensure each doc has fileId (compatibility)
      returned = returned.map((d) => ({ ...d, fileId: d.fileId || d._id }));

      setDocs(returned);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocs([]);
      setMessage("Failed to load documents");
    } finally {
      setLoading(false);
      // clear message after short time
      setTimeout(() => setMessage(""), 3500);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?._id, userRole]);

  // Upload (employee)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please choose a file.");
    if (!lead?._id) return setMessage("No client selected.");

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/files/${lead._id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      await fetchDocs();
      reload?.();
      setMessage("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Toggle selection
  const toggleSelect = (fileId) => {
    setSelectedDocs((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
  };

  // Forward selected documents -> only forward docs allowed to be forwarded
  const handleForwardSelected = async () => {
    // only forward documents that can be forwarded (not already forwarded)
    const toForward = selectedDocs.filter((id) => {
      const doc = docs.find((d) => (d.fileId || d._id).toString() === id.toString());
      return doc && canBeForwarded(doc);
    });

    if (!toForward.length) {
      setMessage("No selectable documents selected or they are already forwarded.");
      return;
    }

    try {
      setForwarding(true);
      const res = await api.post(`/files/${lead._id}/forward`, { documentsToForward: toForward });
      setMessage(res.data?.message || "Selected documents forwarded");
      setSelectedDocs([]);
      await fetchDocs();
      reload?.();
    } catch (err) {
      console.error("Forward selected error:", err);
      setMessage(err?.response?.data?.message || "Forward failed");
    } finally {
      setForwarding(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Forward all -> only forward docs that can be forwarded (prevents automatic forwarding of newly uploaded docs)
  const handleForwardAll = async () => {
    const toForward = docs.filter(canBeForwarded).map((d) => d.fileId || d._id);

    if (!toForward.length) {
      setMessage("No pending documents to forward.");
      return;
    }

    if (!window.confirm(`Forward ${toForward.length} document(s) to Preparation?`)) return;

    try {
      setForwarding(true);
      const res = await api.post(`/files/${lead._id}/forward`, { documentsToForward: toForward });
      setMessage(res.data?.message || "All pending documents forwarded");
      setSelectedDocs([]);
      await fetchDocs();
      reload?.();
    } catch (err) {
      console.error("Forward all error:", err);
      setMessage(err?.response?.data?.message || "Forward all failed");
    } finally {
      setForwarding(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Preview
  const handlePreview = async (fileId) => {
    try {
      const res = await api.get(`/files/download/${fileId}?preview=true`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Preview error:", err);
      setMessage("Preview failed (maybe not authorized).");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {userRole === "preparer" ? "Forwarded Documents" : `Client Documents${lead?.clientName ? ` — ${lead.clientName}` : ""}`}
        </h3>
        {message && <div className="text-sm text-gray-600">{message}</div>}
      </div>

      {/* Upload area (employee only) */}
      {userRole === "employee" && (
        <form onSubmit={handleUpload} className="flex gap-3 items-center mb-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border rounded p-2 text-sm flex-1"
          />
          <button
            type="submit"
            disabled={uploading}
            className={`px-4 py-2 rounded text-white font-medium ${uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {/* Documents table */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No documents found.</div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {(userRole === "employee" || userRole === "teamlead") && <th className="p-3 text-left">Select</th>}
                <th className="p-3 text-left">File name</th>
                <th className="p-3 text-left">Uploaded by</th>
                <th className="p-3 text-left">Uploaded at</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, idx) => {
                const fileId = doc.fileId || doc._id;
                const forwarded = isDocForwarded(doc);
                const forwardedLabel = forwarded ? "Forwarded" : "Not forwarded";

                return (
                  <tr key={fileId + "-" + idx} className="border-t hover:bg-gray-50">
                    {(userRole === "employee" || userRole === "teamlead") && (
                      <td className="p-3">
                        {forwarded ? (
                          <span className="text-green-600 font-semibold">✓</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(fileId)}
                            onChange={() => toggleSelect(fileId)}
                            className="w-4 h-4"
                          />
                        )}
                      </td>
                    )}

                    <td className="p-3 font-medium text-gray-800">{doc.fileName || doc.filename || "Unnamed"}</td>

                    <td className="p-3 text-gray-700">
                      {doc.uploadedBy?.FirstName || doc.uploadedBy?.name || "Unknown"}
                      <div className="text-xs text-gray-400">
                        {doc.uploadedBy?.teamName || ""} {doc.uploadedBy?.role ? `- ${doc.uploadedBy?.role}` : ""}
                      </div>
                    </td>

                    <td className="p-3 text-gray-600">{new Date(doc.uploadedAt || doc.uploadDate || doc.createdAt || Date.now()).toLocaleString()}</td>

                    <td className={`p-3 font-semibold ${forwarded ? "text-green-700" : "text-gray-600"}`}>{forwardedLabel}</td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handlePreview(fileId)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Forward controls */}
      {(userRole === "employee" || userRole === "teamlead") && docs.length > 0 && (
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleForwardSelected}
            disabled={forwarding || selectedDocs.length === 0}
            className={`px-4 py-2 rounded font-medium text-white ${forwarding || selectedDocs.length === 0 ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            {forwarding ? "Forwarding..." : `Forward Selected (${selectedDocs.length})`}
          </button>

          <button
            onClick={handleForwardAll}
            disabled={forwarding}
            className={`px-4 py-2 rounded font-medium text-white ${forwarding ? "bg-gray-400" : "bg-yellow-600 hover:bg-yellow-700"}`}
          >
            {forwarding ? "Forwarding..." : "Forward All Pending"}
          </button>
        </div>
      )}

      {/* Show client-level forwarded timestamp if exists */}
      {lead?.forwardedToPreparation && lead?.forwardedDate && (
        <div className="mt-4 text-sm text-green-700">
          Forwarded on: {new Date(lead.forwardedDate).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
