import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const Reviewer = () => {
  const [clients, setClients] = useState([]);
  const [reviewedClients, setReviewedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "reviewed"
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [error, setError] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  // Fetch clients based on tab
  const fetchClients = async (tab = "pending") => {
    try {
      setLoading(true);
      if (tab === "pending") {
        const res = await api.get("/review/forwarded-to-reviewer");
        setClients(res.data?.clients || []);
      } else {
        const res = await api.get("/review/Marked");
        setReviewedClients(res.data?.clients || []);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      if (tab === "pending") setClients([]);
      else setReviewedClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(activeTab);
  }, [activeTab]);

  // Mark as reviewed
  const handleMarkReviewed = async (clientId) => {
    if (!window.confirm("Mark this client as reviewed?")) return;
    try {
      setLoading(true);
      const res = await api.post(`/review/${clientId}/mark-reviewed`);
      setMessage(res.data?.message || "Client marked as reviewed successfully");
      fetchClients(activeTab);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error marking as reviewed:", err);
      alert(err.response?.data?.message || "Failed to mark as reviewed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle file download
  const handleDownload = (fileId, fileName) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const fileUrl = `${baseUrl}/files/download/${fileId}`;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ✅ Handle file preview
  const handleView = (fileId, fileName) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const fileUrl = `${baseUrl}/files/download/${fileId}?preview=true`;

    const ext = fileName?.split(".").pop()?.toLowerCase();
    let type = "other";
    if (["pdf"].includes(ext)) type = "pdf";
    else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
      type = "image";
    else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
      type = "office";

    setPreviewType(type);
    setPreviewFile(fileUrl);
  };
  const handleReturnClick = (clientId) => {
    setSelectedClientId(clientId);
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    if (!returnReason.trim()) {
      alert("Please enter reason");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        `/review/${selectedClientId}/return-to-preparer`,
        { reason: returnReason }
      );

      setMessage(res.data?.message || "Returned to preparer");
      setShowReturnModal(false);
      setReturnReason("");
      fetchClients(activeTab);
    } catch (err) {
      console.error("Return error:", err);
      alert(err.response?.data?.message || "Failed to return");
    } finally {
      setLoading(false);
    }
  };

  // Render table
  const renderTable = (list, isPending = true) => (
    <div className="overflow-auto max-h-[500px] border rounded-md">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left border">Client Name</th>
            <th className="p-2 text-left border">Email</th>
            <th className="p-2 text-left border">Team</th>
            <th className="p-2 text-left border">Preparer</th>
            <th className="p-2 text-left border">Assigned Employee</th>
            <th className="p-2 text-center border">Forwarded Date</th>
            <th className="p-2 text-center border">Actions</th>
            <th className="p-2 text-center border">
              {isPending ? "Mark Reviewed" : "Reviewed On"}
            </th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && !loading && (
            <tr>
              <td colSpan={8} className="p-2 text-gray-500 text-center border">
                {activeTab === "pending"
                  ? "No clients forwarded for review yet."
                  : "No clients have been reviewed yet."}
              </td>
            </tr>
          )}

          {loading && (
            <tr>
              <td colSpan={8} className="p-2 text-center border">
                Loading...
              </td>
            </tr>
          )}

          {list.map((client, idx) => (
            <tr key={idx} className="hover:bg-gray-50 border-b">
              <td className="p-2 border">{client.clientName || "—"}</td>
              <td className="p-2 border">{client.email || "—"}</td>
              <td className="p-2 border">
                {client.assignedTo ? client.assignedTo.teamName : "—"}
              </td>
              <td className="p-2 border">
                {client.forwardedByPreparer?.FirstName || "—"}
              </td>
              <td className="p-2 border">
                {client.assignedTo
                  ? `${client.assignedTo.FirstName} ${client.assignedTo.LastName}`
                  : "—"}
              </td>
              <td className="p-2 border text-center">
                {client.forwardedToReviewerDate
                  ? new Date(client.forwardedToReviewerDate).toLocaleString()
                  : "—"}
              </td>
              {/* Actions Column: View & Download */}
              <td className="p-2 border text-center space-x-2">
                {client.documents?.map((file) => (
                  <React.Fragment key={file._id}>
                    <button
                      onClick={() => handleView(file.fileId, file.fileName)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(file.fileId, file.fileName)}
                      className="text-purple-600 hover:underline mr-2"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleReturnClick(client._id)}
                      className="text-red-600 hover:underline"
                    >
                      Return
                    </button>
                  </React.Fragment>
                ))}
              </td>
              {/* Mark Reviewed / Reviewed On */}
              <td className="p-2 border text-center">
                {isPending ? (
                  <button
                    onClick={() => handleMarkReviewed(client._id)}
                    disabled={loading}
                    className={`text-green-600 hover:underline ${loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    Mark Reviewed
                  </button>
                ) : (
                  client.reviewedDate
                    ? new Date(client.reviewedDate).toLocaleString()
                    : "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Reviewer Dashboard</h2>

      {/* Tab Selector */}
      <div className="mb-4 flex space-x-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === "pending"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Review
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "reviewed"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
          onClick={() => setActiveTab("reviewed")}
        >
          Reviewed Clients
        </button>
      </div>

      {message && (
        <div className="mb-3 text-green-600 font-medium">{message}</div>
      )}

      {activeTab === "pending"
        ? renderTable(clients, true)
        : renderTable(reviewedClients, false)}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
            >
              &times;
            </button>

            <h3 className="text-lg font-semibold mb-3">File Preview</h3>
            <div className="border rounded h-[70vh] overflow-hidden">
              {error && (
                <div className="text-red-600 text-center mt-4">{error}</div>
              )}

              {previewType === "pdf" && (
                <iframe
                  src={previewFile}
                  title="PDF Preview"
                  className="w-full h-full"
                ></iframe>
              )}
              {previewType === "image" && (
                <img
                  src={previewFile}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
              {previewType === "office" && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    previewFile
                  )}`}
                  title="Office Preview"
                  className="w-full h-full"
                ></iframe>
              )}
              {previewType === "other" && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-3">
              Return to Preparer
            </h3>

            <textarea
              className="w-full border rounded p-2 mb-3"
              rows="4"
              placeholder="Enter reason for returning..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitReturn}
                className="px-4 py-1 bg-red-600 text-white rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviewer;
