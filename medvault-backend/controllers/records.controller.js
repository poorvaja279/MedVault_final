// backend/controllers/records.controller.js
const { s3Client } = require("../config/s3");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Record = require("../models/Record");
const AccessRequest = require("../models/AccessRequest");

const BUCKET = process.env.AWS_BUCKET_NAME;
console.log("S3 Bucket from env:", BUCKET);

// 🟢 Upload record for authenticated patient
exports.upload = async (req, res) => {
  try {
    const patientId = req.user.id; // JWT middleware adds user info
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const fileKey = `records/${patientId}/${Date.now()}-${file.originalname}`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    // Save record metadata in MongoDB
    const record = await Record.create({
      patientId,
      fileName: file.originalname,
      fileKey,
    });

    return res.status(200).json({
      message: "File uploaded successfully",
      key: record.fileKey,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error uploading record" });
  }
};

// 🟡 List all records for logged-in patient (with signed URLs)
// 🟡 List all records (patient → own | doctor → authorized patients)
const Patient = require("../models/Patient"); // Require Patient model

exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const requestedPatientCode = req.query.patientId; // patient code string

    let targetPatientIdObj; // will store MongoDB ObjectId

    if (role === "patient") {
      // If patient, use their own ObjectId
      targetPatientIdObj = userId;
    } else if (role === "doctor") {
      if (!requestedPatientCode) {
        return res.status(400).json({ error: "patientId query parameter is required" });
      }

      // Find the Patient document using the code string
      const patientDoc = await Patient.findOne({ patientId: requestedPatientCode }).select('_id');
      if (!patientDoc) {
        return res.status(404).json({ error: "Patient not found" });
      }

      targetPatientIdObj = patientDoc._id;

      // Verify access
      const access = await AccessRequest.findOne({
        doctorId: userId,
        patientId: targetPatientIdObj,
        status: "approved",
      });

      if (!access) {
        return res.status(403).json({ error: "Access denied: Not authorized for this patient" });
      }
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    // Fetch records using MongoDB ObjectId
    const records = await Record.find({ patientId: targetPatientIdObj }).sort({ uploadedAt: -1 });

    // Generate signed URLs (no change here)
    const signedRecords = await Promise.all(
      records.map(async (r) => {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: r.fileKey });
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
        return {
          fileName: r.fileName,
          uploadedAt: r.uploadedAt,
          url: signedUrl,
          fileKey: r.fileKey,
        };
      })
    );

    return res.status(200).json(signedRecords);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "Error fetching records" });
  }
};



// 🔵 Download single record securely (optional, if you want stream)
exports.download = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { key } = req.params;

    const record = await Record.findOne({ patientId, fileKey: key });
    if (!record) return res.status(404).json({ error: "Record not found" });

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });

    res.status(200).json({ url: signedUrl });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Error generating download link" });
  }
};

const { DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

// 🔴 Delete record (from both S3 + DB)
exports.delete = async (req, res) => {
  try {
    console.log("[Delete] key param:", req.params.key);
    const patientId = req.user.id;
    const { key } = req.params;

    // Find record in DB
    const record = await Record.findOne({ patientId, fileKey: key });
    if (!record) return res.status(404).json({ error: "Record not found" });

    // Delete from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));

    // Delete from DB
    await Record.deleteOne({ _id: record._id });

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Error deleting record" });
  }
};

