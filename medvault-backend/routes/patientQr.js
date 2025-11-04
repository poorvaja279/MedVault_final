const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const authMiddleware = require("../middlewares/authMiddleware")(["patient"]);
const generateQrCode = require("../utils/qrGenerator");

// GET /api/patient/qr
router.get("/qr", authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;

    // Fetch patient from DB
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Prepare clean QR payload
  const qrPayload = {
  patientId: patient.patientId || patient._id.toString(),
  fullName: patient.fullName,
  bloodGroup: patient.bloodGroup || "Not specified",
  emergencyPhone: patient.phone || "Not provided",
  allergies: ["Peanut allergy"]
};

    // Generate QR code from properly stringified object
    const qrCodeData = await generateQrCode(qrPayload);

    res.json({
      fullName: patient.fullName,
      patientId: qrPayload.patientId,
      qrCode: qrCodeData
    });

  } catch (err) {
    console.error("Error in /qr route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;