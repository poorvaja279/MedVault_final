const mongoose = require("mongoose");

const pendingDoctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    nmcRegNo: { type: String, required: true },
    stateMedicalCouncil: { type: String, default: "" }, // ✅ always optional
    hospitalAddress: { type: String, required: true },
    speciality: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletAddress: { type: String },
    submittedAt: { type: Date, default: Date.now },
    verificationReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingDoctor", pendingDoctorSchema);
