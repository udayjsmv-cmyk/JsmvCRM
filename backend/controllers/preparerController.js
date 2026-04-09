// controllers/preparerController.js
const Client = require("../models/Client");
const ActivityLog = require("../models/ActivityLog");
const mongoose = require("mongoose");
 const { uploadToGridFS } = require("../middleware/uploadMiddleware");
exports.getAllForwardedDocuments = async (req, res) => {
  try {
    if (!["preparer", "manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Fetch clients forwarded for preparation or returned for corrections
    const clients = await Client.find({})
  .populate("documents.uploadedBy", "FirstName LastName email role teamName")
  .select("clientName email documents forwardedToReviewer");

const allDocs = clients.flatMap((client) =>
      (client.documents || [])
      .filter((doc) =>
      ["uploaded", "in-preparation", "corrections"].includes(doc.status) ||
      doc.reviewStatus === "returned"
    )
    .map((doc) => ({
      clientId: client._id,
      clientName: client.clientName,
      clientEmail: client.email,
      fileId: doc.fileId,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.reviewStatus === "corrections" ? "corrections" : doc.status,
      uploadedAt: doc.uploadedAt,

      // ✅ ADD THIS
      reviewNotes: doc.reviewNotes || "",
      returnedAt: doc.returnedAt || null,

      uploadedBy: doc.uploadedBy
        ? {
            name: `${doc.uploadedBy.FirstName || ""} ${doc.uploadedBy.LastName || ""}`.trim(),
            email: doc.uploadedBy.email,
            role: doc.uploadedBy.role,
            teamName: doc.uploadedBy.teamName,
          }
        : null,

      version: doc.version || "original",
      parentFileId: doc.parentFileId || null,

      // ✅ KEY FIX: document-level flags
      isReturned: doc.reviewStatus === "corrections",
     isPending:
      doc.reviewStatus !== "corrections" &&
     ["uploaded", "in-preparation"].includes(doc.status),
      isForwarded: doc.status === "forwarded-review",
    }))
);

    // 🔥 Sort: returned first, then latest
allDocs.sort((a, b) => {
  if (a.status === "corrections" && b.status !== "corrections") return -1;
  if (a.status !== "corrections" && b.status === "corrections") return 1;
  return new Date(b.uploadedAt) - new Date(a.uploadedAt);
});
    return res.status(200).json({ documents: allDocs });
  } catch (err) {
    console.error("❌ Error fetching preparer documents:", err);
    return res
      .status(500)
      .json({ message: "Error fetching preparer documents", error: err.message });
  }
};
exports.uploadUpdatedDocument = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    if (req.user.role !== "preparer") {
      return res.status(403).json({ message: "Only Preparer allowed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadedFile = await uploadToGridFS(req.file, req.user);

    if (!uploadedFile || !uploadedFile.fileId) {
      return res.status(500).json({ message: "File upload failed" });
    }

    const newDoc = {
      fileId: uploadedFile.fileId,
      fileName: uploadedFile.fileName,
      fileType: uploadedFile.fileType,
      fileUrl: uploadedFile.fileUrl,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      teamName: req.user.teamName,
      uploadedByRole: "preparer",
      version: "updated",
      parentFileId: req.body.parentFileId || null,
      status: "in-preparation",
      forwardedToPreparationDate: new Date(),
    };

    if (!Array.isArray(client.documents)) {
      client.documents = [];
    }

    client.documents.push(newDoc);

    client.handledByPreparer = req.user._id;
    client.forwardedToPreparation = true;
    client.returnedToPreparation = false;
    client.updatedBy = req.user._id;
    client.updatedAt = new Date();

    client.actionHistory.push({
      action: "Updated Document Uploaded",
      performedBy: req.user._id,
      notes: `Uploaded updated document ${uploadedFile.fileName}`,
      date: new Date(),
    });

    await client.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: "upload_updated_doc",
      targetCollection: "Client",
      targetId: client._id,
      details: { 
        fileName: uploadedFile.fileName, 
        fileId: uploadedFile.fileId 
      },
    });

    res.status(200).json({
      message: "Updated document uploaded successfully",
      document: newDoc,
    });
  } catch (err) {
    console.error("❌ uploadUpdatedDocument error:", err);
    res.status(500).json({
      message: "Error uploading updated document",
      error: err.message,
    });
  }
};
exports.forwardToReviewer = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentsToForward = [] } = req.body; // optional selective forwarding

    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    if (req.user.role !== "preparer") {
      return res.status(403).json({ message: "Only Preparer can forward to reviewer" });
    }

    if (!client.forwardedToPreparation) {
      return res.status(400).json({ message: "Client not yet in preparation stage" });
    }

    if (client.forwardedToReviewer) {
      return res.status(400).json({ message: "Client already forwarded to reviewer" });
    }

    // Update document statuses
    client.documents.forEach((doc) => {
      if (
        !documentsToForward.length ||
        documentsToForward.includes(doc.fileId.toString())
      ) {
        doc.status = "forwarded-review";
        doc.forwardedToReviewerDate = new Date();
      }
    });

    // Mark oAverall workflow
    client.forwardedToReviewer = true;
    client.forwardedToReviewerDate = new Date();
    client.forwardedByPreparer = req.user._id;
    client.reviewedBy = null;

    client.actionHistory.push({
      action: "Forwarded to Reviewer",
      performedBy: req.user._id,
      notes: `Forwarded ${documentsToForward.length || "all"} documents to reviewer`,
      date: new Date(),
    });

    client.updatedBy = req.user._id;
    client.updatedAt = new Date();

    await client.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: "forward_to_reviewer",
      targetCollection: "Client",
      targetId: client._id,
      details: {
        forwardedToReviewerDate: client.forwardedToReviewerDate,
        preparerName: `${req.user.FirstName || ""} ${req.user.LastName || ""}`.trim(),
      },
    });

    return res.json({
      message: "Client and documents forwarded to reviewer successfully",
      client,
    });
  } catch (err) {
    console.error("❌ forwardToReviewer error:", err);
    return res
      .status(500)
      .json({ message: "Error forwarding to reviewer", error: err.message });
  }
};
