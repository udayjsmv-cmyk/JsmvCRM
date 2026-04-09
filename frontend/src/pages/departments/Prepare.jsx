// src/pages/panels/Preparer.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
const Badge = ({ children, tone = "gray" }) => {
  const map = {
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
};

const IconRefresh = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 12a9 9 0 10-3.16 6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconForward = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 12h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// -------------------- Component --------------------
export default function Preparer() {
  const [clients, setClients] = useState([]); // grouped list
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [stagedFiles, setStagedFiles] = useState({}); // { [parentFileId]: File }
  const [uploadProgress, setUploadProgress] = useState({}); // { [parentFileId]: percent }
  const [uploadingFor, setUploadingFor] = useState(null); // parentFileId
  const [preview, setPreview] = useState({ url: null, type: null, title: "" });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || api.defaults.baseURL || "";

  // Fetch documents and group by client
  const fetchClients = async () => {
    try {
      setLoading(true);
      setInfoMessage("");
      const res = await api.get("/files/forwarded");
      const docs = res?.data?.documents || [];

      // Group by clientId
      const grouped = docs.reduce((acc, d) => {
        const id = d.clientId || "unknown";
        if (!acc[id]) {
          acc[id] = { clientId: id, clientName: d.clientName || "Unknown", clientEmail: d.clientEmail || "-", documents: [] };
        }
        acc[id].documents.push(d);
        return acc;
      }, {});

      // For each client: sort docs so returned first, then updated, then original (recent first)
      const clientList = Object.values(grouped).map((c) => {
        const docsSorted = [...c.documents].sort((a, b) => {
          const aReturned = a.status === "returned";
          const bReturned = b.status === "returned";
          if (aReturned !== bReturned) return aReturned ? -1 : 1; // returned first
          // prefer updated over original
          const aUpdated = a.version === "updated";
          const bUpdated = b.version === "updated";
          if (aUpdated !== bUpdated) return aUpdated ? -1 : 1;
          // newer first
          return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
        });

        const hasReturned = docsSorted.some((x) => x.status === "returned");

        const hasPending = docsSorted.some(
          (x) => x.status !== "forwarded-review" && x.status !== "returned"
        );
        return { ...c, documents: docsSorted, hasReturned, hasPending };
      });

      // Sort clients: ones with returned docs first, then with pending, then rest by most-recent doc
      clientList.sort((A, B) => {
        if (A.hasReturned !== B.hasReturned) return A.hasReturned ? -1 : 1;
        if (A.hasPending !== B.hasPending) return A.hasPending ? -1 : 1;
        const aTime = A.documents?.[0]?.uploadedAt ? new Date(A.documents[0].uploadedAt) : 0;
        const bTime = B.documents?.[0]?.uploadedAt ? new Date(B.documents[0].uploadedAt) : 0;
        return bTime - aTime;
      });

      setClients(clientList);
    } catch (err) {
      console.error("fetchClients:", err);
      setInfoMessage("Failed to load forwarded documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stage file per document (parentFileId)
  const stageFileForDoc = (parentFileId, file) => {
    setStagedFiles((s) => ({ ...s, [parentFileId]: file }));
  };

  // Upload updated doc for parent document
  const uploadUpdatedForDoc = async (clientId, parentFileId) => {
    const file = stagedFiles[parentFileId];
    if (!file) {
      alert("Select a file for this document before uploading.");
      return;
    }
    try {
      setUploadingFor(parentFileId);
      setUploadProgress((p) => ({ ...p, [parentFileId]: 0 }));
      const fd = new FormData();
      fd.append("file", file);
      fd.append("parentFileId", parentFileId);

      const res = await api.post(`/files/preparer/upload/${clientId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadProgress((p) => ({ ...p, [parentFileId]: pct }));
        },
      });

      setInfoMessage(res?.data?.message || "Updated document uploaded.");
      // clear staged file for that doc
      setStagedFiles((s) => {
        const copy = { ...s };
        delete copy[parentFileId];
        return copy;
      });
      setUploadProgress((p) => {
        const copy = { ...p };
        delete copy[parentFileId];
        return copy;
      });
      await fetchClients();
    } catch (err) {
      console.error("uploadUpdatedForDoc:", err);
      setInfoMessage(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploadingFor(null);
    }
  };

  // Forward entire client to reviewer
  const forwardClient = async (clientId) => {
    if (!window.confirm("Forward all documents for this client to reviewer?")) return;
    try {
      const res = await api.post(`/review/${clientId}/forward-to-reviewer`);
      setInfoMessage(res?.data?.message || "Client forwarded to reviewer.");
      await fetchClients();
    } catch (err) {
      console.error("forwardClient:", err);
      setInfoMessage(err?.response?.data?.message || "Forward failed.");
    }
  };

  // Preview popup (modal)
  const openPreview = (fileId, fileName) => {
    const url = `${baseUrl}/files/download/${fileId}?preview=true`;
    const ext = (fileName || "").split(".").pop().toLowerCase();
    let type = "other";
    if (["pdf"].includes(ext)) type = "pdf";
    else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) type = "image";
    else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) type = "office";
    setPreview({ url, type, title: fileName || "Preview" });
  };
  const closePreview = () => setPreview({ url: null, type: null, title: "" });

  // Download file
  const downloadFile = (fileId) => {
    window.open(`${baseUrl}/files/download/${fileId}`, "_blank");
  };

  // render doc status
  const renderDocStatus = (doc) => {
    if (["returned", "corrections"].includes(doc.status)) return <Badge tone="red">Returned</Badge>;
    if (doc.status === "forwarded-review") return <Badge tone="green">Forwarded</Badge>;
    return <Badge tone="yellow">Pending</Badge>;
  };

  // small helper for uploadedBy display
  const uploaderLabel = (u) => {
    if (!u) return "Unknown";
    const name = u.name || `${u.FirstName || ""} ${u.LastName || ""}`.trim() || u.email || "Unknown";
    return name;
  };

  // UI ----------------------------------------------------------------
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Preparer — Documents</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClients}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
            title="Refresh"
          >
            <IconRefresh className="text-gray-700" />
            Refresh
          </button>
        </div>
      </div>

      {infoMessage && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded text-blue-800">
          {infoMessage}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-gray-500">No forwarded documents available.</div>
      ) : (
        <div className="grid gap-6">
          {clients.map((client) => (
            <div
              key={client.clientId}
              className={`p-4 rounded-xl shadow-sm border transition ${client.hasReturned ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold leading-tight">{client.clientName}</h2>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">{client.clientEmail}</span>
                      <span className="text-xs text-gray-400">Client ID: {client.clientId}</span>
                    </div>

                    {client.hasReturned ? (
                      <Badge tone="red">Needs Correction</Badge>
                    ) : client.hasPending ? (
                      <Badge tone="yellow">Pending</Badge>
                    ) : (
                      <Badge tone="green">All Forwarded</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => forwardClient(client.clientId)}
                    className="flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                  >
                    <IconForward />
                    Forward All
                  </button>
                </div>
              </div>
              <div className="mt-5">
  <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        
        {/* HEADER */}
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 backdrop-blur">
          <tr className="text-gray-600 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Document</th>
            <th className="px-4 py-3 text-left">Version</th>
            <th className="px-4 py-3 text-left">Uploader</th>
            <th className="px-4 py-3 text-left">Team</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-left">Reviewer</th>
            <th className="px-4 py-3 text-center">Actions</th>
            <th className="px-4 py-3 text-center">Update</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y divide-gray-100">
          {client.documents.map((doc, index) => {
            const staged = stagedFiles[doc.fileId];
            const uploading = uploadingFor === doc.fileId;

            return (
              <tr
                key={doc.fileId}
                className={`group transition-all duration-200 
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"} 
                hover:bg-indigo-50/40`}
              >

                {/* DOCUMENT */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 group-hover:text-indigo-700">
                      {doc.fileName}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {doc.fileId}
                    </span>
                  </div>
                </td>

                {/* VERSION */}
                <td className="px-4 py-3">
                  <Badge tone={doc.version === "updated" ? "indigo" : "gray"}>
                    {doc.version === "updated" ? "Updated" : "Original"}
                  </Badge>
                </td>

                {/* UPLOADER */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-700">
                    {uploaderLabel(doc.uploadedBy)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {doc.uploadedBy?.email}
                  </div>
                </td>

                {/* TEAM */}
                <td className="px-4 py-3 text-gray-600">
                  {doc.uploadedBy?.teamName || "—"}
                </td>

                {/* DATE */}
                <td className="px-4 py-3 text-gray-600">
                  {doc.uploadedAt
                    ? new Date(doc.uploadedAt).toLocaleString()
                    : "—"}
                </td>

                {/* STATUS */}
                <td className="px-4 py-3 text-center">
                  {renderDocStatus(doc)}
                </td>

                {/* REVIEWER */}
                <td className="px-4 py-3">
                  {["returned", "corrections"].includes(doc.status) ? (
                    <div className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 shadow-sm">
                      <div className="font-semibold text-red-700">
                        Needs Fix
                      </div>
                      <div className="text-gray-700">
                        {doc.reviewNotes || "No remarks"}
                      </div>
                      <div className="text-gray-400 text-[11px]">
                        {doc.returnedToPreparationDate
                          ? new Date(doc.returnedToPreparationDate).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition">

                    <button
                      onClick={() => openPreview(doc.fileId, doc.fileName)}
                      className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium"
                    >
                      Preview
                    </button>

                    <button
                      onClick={() => downloadFile(doc.fileId)}
                      className="px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-medium"
                    >
                      Download
                    </button>

                  </div>
                </td>

                {/* UPDATE */}
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-2">

                    {/* FILE PICK */}
                    <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 shadow-sm">
                      Choose
                      <input
                        type="file"
                        onChange={(e) =>
                          stageFileForDoc(doc.fileId, e.target.files?.[0])
                        }
                        className="hidden"
                      />
                    </label>

                    {/* UPLOAD BTN */}
                    <button
                      onClick={() =>
                        uploadUpdatedForDoc(client.clientId, doc.fileId)
                      }
                      disabled={!staged || uploading}
                      className={`w-full px-3 py-1.5 rounded-md text-xs font-medium text-white transition
                        ${staged
                          ? "bg-indigo-600 hover:bg-indigo-700 shadow"
                          : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>

                    {/* PROGRESS */}
                    {uploadProgress[doc.fileId] && (
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                          style={{
                            width: `${uploadProgress[doc.fileId]}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="text-[11px] text-gray-400 truncate max-w-[120px]">
                      {staged ? staged.name : "No file"}
                    </div>

                  </div>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
</div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={closePreview}
        >
          <div className="relative w-11/12 md:w-4/5 lg:w-3/5 bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="text-lg font-semibold">{preview.title}</div>
              <button onClick={closePreview} className="text-xl px-2">×</button>
            </div>
            <div className="h-[75vh]">
              {preview.type === "pdf" && <iframe src={preview.url} title={preview.title} className="w-full h-full" />}
              {preview.type === "image" && <img src={preview.url} alt={preview.title} className="w-full h-full object-contain" />}
              {preview.type === "office" && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.url)}`}
                  title={preview.title}
                  className="w-full h-full"
                />
              )}
              {preview.type === "other" && (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
