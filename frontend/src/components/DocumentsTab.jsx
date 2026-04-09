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

const isDocForwarded = (doc) => FORWARDED_STATUSES.includes(doc.status);
const canBeForwarded = (doc) =>
  !isDocForwarded(doc) && (doc.status === "uploaded" || !doc.status);

const DocumentsTab = ({ lead, role, reload }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const userRole = role || getUserRole();

  // Fetch documents
  const fetchDocs = async () => {
    try {
      setLoading(true);
      let res;

      if (userRole === "preparer") {
        res = await api.get("/files/forwarded");
      } else if (lead?._id) {
        res = await api.get(`/files/${lead._id}`);
      } else {
        setDocs([]);
        return;
      }

      let returned = Array.isArray(res.data)
        ? res.data
        : res.data.documents || [];

      if (userRole !== "preparer") {
        returned = returned.filter(
          (d) =>
            (d.uploadedByRole || d.uploadedBy?.role || "").toString() !==
            "preparer"
        );
      }

      if (userRole === "preparer") {
        returned = returned.filter((d) =>
          d.status
            ? FORWARDED_STATUSES.includes(d.status) ||
              ["corrections", "returned"].includes(d.status)
            : false
        );
      }

      returned = returned.map((d) => ({
        ...d,
        fileId: d.fileId || d._id,
      }));

      setDocs(returned);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocs([]);
      setMessage("Failed to load documents");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [lead?._id, userRole]);

  // ✅ FIXED Upload (Employee)
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) return setMessage("Please choose a file.");
    if (!lead?._id) return setMessage("No client selected.");

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      // ✅ FIX: Correct API endpoint
      await api.post(`/files/${lead._id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      await fetchDocs();
      reload?.();

      setMessage("File uploaded successfully ✅");
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err?.response?.data?.message || "Upload failed ❌");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const toggleSelect = (fileId) => {
    setSelectedDocs((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleForwardSelected = async () => {
    const toForward = selectedDocs.filter((id) => {
      const doc = docs.find((d) => d.fileId.toString() === id.toString());
      return doc && canBeForwarded(doc);
    });

    if (!toForward.length) {
      setMessage("No valid documents selected.");
      return;
    }

    try {
      setForwarding(true);

      const res = await api.post(`/files/${lead._id}/forward`, {
        documentsToForward: toForward,
      });

      setMessage(res.data?.message || "Forwarded successfully");
      setSelectedDocs([]);

      await fetchDocs();
      reload?.();
    } catch (err) {
      console.error("Forward error:", err);
      setMessage(err?.response?.data?.message || "Forward failed");
    } finally {
      setForwarding(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePreview = async (fileId) => {
    try {
      const res = await api.get(
        `/files/download/${fileId}?preview=true`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      window.open(url, "_blank");
    } catch (err) {
      console.error("Preview error:", err);
      setMessage("Preview failed");
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-3">
        {userRole === "preparer"
          ? "Forwarded Documents"
          : `Client Documents - ${lead?.clientName || ""}`}
      </h3>

      {message && <p className="text-sm mb-2">{message}</p>}

      {/* Upload */}
      {userRole === "employee" && (
        <form onSubmit={handleUpload} className="flex gap-2 mb-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : docs.length === 0 ? (
        <p>No documents</p>
      ) : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th>Select</th>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const id = doc.fileId;

              return (
                <tr key={id}>
                  <td>
                    {!isDocForwarded(doc) && (
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(id)}
                        onChange={() => toggleSelect(id)}
                      />
                    )}
                  </td>
                  <td>{doc.fileName}</td>
                  <td>{doc.status}</td>
                  <td>
                    <button onClick={() => handlePreview(id)}>
                      Preview
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Forward */}
      {userRole === "employee" && (
        <button
          onClick={handleForwardSelected}
          disabled={forwarding}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
        >
          {forwarding ? "Forwarding..." : "Forward Selected"}
        </button>
      )}
    </div>
  );
};

export default DocumentsTab;
