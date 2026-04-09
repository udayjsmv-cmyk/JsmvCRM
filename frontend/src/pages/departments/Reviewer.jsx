import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const Reviewer = () => {
  const [clients, setClients] = useState([]);
  const [reviewedClients, setReviewedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [error, setError] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);

  // Fetch Clients
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
      console.error(err);
      if (tab === "pending") setClients([]);
      else setReviewedClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(activeTab);
  }, [activeTab]);

  // Mark Reviewed
  const handleMarkReviewed = async (clientId) => {
    if (!window.confirm("Mark this client as reviewed?")) return;
    try {
      setLoading(true);
      const res = await api.post(`/review/${clientId}/mark-reviewed`);
      setMessage(res.data?.message || "Marked as reviewed");
      fetchClients(activeTab);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  // Download
  const handleDownload = (fileId, fileName) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const link = document.createElement("a");
    link.href = `${baseUrl}/files/download/${fileId}`;
    link.download = fileName || "document";
    link.target = "_blank";
    link.click();
  };

  // Preview
  const handleView = (fileId, fileName) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const fileUrl = `${baseUrl}/files/download/${fileId}?preview=true`;

    const ext = fileName?.split(".").pop()?.toLowerCase();
    let type = "other";

    if (["pdf"].includes(ext)) type = "pdf";
    else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      type = "image";
    else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
      type = "office";

    setPreviewType(type);
    setPreviewFile(fileUrl);
    setError("");
  };

  // Return
  const handleReturnClick = (clientId, fileId) => {
    setSelectedClientId(clientId);
    setSelectedDocs([fileId]);
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    if (!returnReason.trim()) return alert("Enter reason");

    try {
      setLoading(true);
      const res = await api.post(
        `/review/${selectedClientId}/return-to-preparer`,
        {
          reason: returnReason,
          documentIds: selectedDocs,
        }
      );

      setMessage(res.data?.message || "Returned successfully");
      setShowReturnModal(false);
      setReturnReason("");
      setSelectedDocs([]);
      fetchClients(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  };

  const data = activeTab === "pending" ? clients : reviewedClients;

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Reviewer Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Review, manage and approve client documents
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {["pending", "reviewed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab === "pending" ? "Pending Review" : "Reviewed Clients"}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg shadow">
          {message}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Client</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-left">Preparer</th>
                <th className="p-3 text-left">Assigned Employee</th>
                <th className="p-3 text-center">Forwarded Date</th>
                <th className="p-3 text-left">Documents</th>
                <th className="p-3 text-center">
                  {activeTab === "pending"
                    ? "Actions"
                    : "Reviewed On"}
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No data available
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              )}

              {data.map((client, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-gray-800">
                      {client.clientName || "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {client.email || "—"}
                    </div>
                  </td>

                  <td className="p-3">
                    {client.assignedTo?.teamName || "—"}
                  </td>

                  <td className="p-3">
                    {client.forwardedByPreparer?.FirstName || "—"}
                  </td>

                  <td className="p-3">
                    {client.assignedTo
                      ? `${client.assignedTo.FirstName} ${client.assignedTo.LastName}`
                      : "—"}
                  </td>

                  <td className="p-3 text-center text-xs text-gray-500">
                    {client.forwardedToReviewerDate
                      ? new Date(
                          client.forwardedToReviewerDate
                        ).toLocaleString()
                      : "—"}
                  </td>

                  {/* Documents */}
                  <td className="p-3 space-y-2">
                    {client.documents
                      ?.filter((f) => f.status === "forwarded-review")
                      .map((file) => (
                        <div
                          key={file._id}
                          className="flex justify-between items-center bg-gray-50 border rounded-lg px-3 py-2"
                        >
                          <span className="text-xs truncate max-w-[140px]">
                            {file.fileName}
                          </span>

                          <div className="flex gap-2 text-xs">
                            <button
                              onClick={() =>
                                handleView(file.fileId, file.fileName)
                              }
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                handleDownload(file.fileId, file.fileName)
                              }
                              className="text-purple-600 hover:underline"
                            >
                              Download
                            </button>

                            {activeTab === "pending" && (
                              <button
                                onClick={() =>
                                  handleReturnClick(
                                    client._id,
                                    file.fileId
                                  )
                                }
                                className="text-red-500 hover:underline"
                              >
                                Return
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-center">
                    {activeTab === "pending" ? (
                      <button
                        onClick={() =>
                          handleMarkReviewed(client._id)
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded-full text-xs hover:bg-green-700"
                      >
                        Mark Reviewed
                      </button>
                    ) : client.reviewedDate ? (
                      <span className="text-green-600 text-xs">
                        {new Date(
                          client.reviewedDate
                        ).toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl w-11/12 md:w-3/4 lg:w-1/2 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Preview</h3>
              <button onClick={() => setPreviewFile(null)}>✕</button>
            </div>

            <div className="h-[70vh]">
              {previewType === "pdf" && (
                <iframe src={previewFile} className="w-full h-full" />
              )}
              {previewType === "image" && (
                <img
                  src={previewFile}
                  className="w-full h-full object-contain"
                />
              )}
              {previewType === "office" && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    previewFile
                  )}`}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              Return Document
            </h3>

            <textarea
              className="w-full border rounded p-2 mb-3"
              rows="4"
              placeholder="Enter reason..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="bg-gray-200 px-4 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitReturn}
                className="bg-red-600 text-white px-4 py-1 rounded"
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