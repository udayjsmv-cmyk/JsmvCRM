const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { Readable } = require("stream");

// storage
const storage = multer.memoryStorage();

// ✅ upload for documents
const upload = multer({ storage });

// ✅ upload for profile
const profileUpload = multer({ storage });

// ✅ GridFS upload
const uploadToGridFS = async (file, user) => {
  if (!file || !file.buffer) {
    throw new Error("File buffer is missing");
  }

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("open", resolve);
      mongoose.connection.once("error", reject);
    });
  }

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, {
    bucketName: "clientDocuments",
  });

  const filename = `${Date.now()}-${file.originalname}`;

  const readableStream = new Readable();
  readableStream.push(file.buffer);
  readableStream.push(null);

  const uploadStream = bucket.openUploadStream(filename, {
    contentType: file.mimetype,
  });

  await new Promise((resolve, reject) => {
    readableStream
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", resolve);
  });

  return {
    fileId: uploadStream.id,
    fileName: filename,
    fileType: file.mimetype,
    fileUrl: `/api/files/download/${uploadStream.id}`,
  };
};

// ✅ VERY IMPORTANT EXPORT
module.exports = {
  upload,
  profileUpload,
  uploadToGridFS,
};