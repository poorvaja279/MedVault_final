const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const PendingDoctor = require("../models/PendingDoctor");
const { generateDoctorId } = require("../utils/idGenerator");

// Admin credentials (can later move to .env)
const ADMIN_ID = "YDPGM-Blockchain";
const ADMIN_PASS = "Fslot@SJT421";

// Helper to generate a unique doctorId
async function getUniqueDoctorId() {
  let unique = false;
  let id;
  while (!unique) {
    id = generateDoctorId();
    const exists = await Doctor.findOne({ doctorId: id });
    if (!exists) unique = true;
  }
  return id;
}

// 🔹 Admin login
exports.adminLogin = async (req, res) => {
  const { adminId, password } = req.body;
  if (adminId === ADMIN_ID && password === ADMIN_PASS) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" });
    return res.json({ message: "Admin login successful", token });
  }
  return res.status(401).json({ error: "Invalid admin credentials" });
};

// 🔹 List pending doctors
exports.listPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await PendingDoctor.find().sort({ submittedAt: -1 });
    res.json(pendingDoctors);
  } catch (err) {
    console.error("❌ List pending doctors error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Approve doctor (✅ FIXED)
exports.approveDoctor = async (req, res) => {
  try {
    const { pendingDoctorId } = req.params;

    // Find pending doctor
    const pendingDoctor = await PendingDoctor.findById(pendingDoctorId);
    if (!pendingDoctor)
      return res.status(404).json({ error: "Pending doctor not found" });

    // Ensure doctor doesn't already exist
    const exists = await Doctor.findOne({
      $or: [{ email: pendingDoctor.email }, { phone: pendingDoctor.phone }]
    });
    if (exists)
      return res.status(400).json({ error: "Doctor with same email or phone already exists" });

    // Generate doctorId
    const doctorId = await getUniqueDoctorId();

    // ✅ Create doctor FIRST
    const doctor = await Doctor.create({
      doctorId,
      fullName: pendingDoctor.fullName,
      dob: pendingDoctor.dob,
      nmcRegNo: pendingDoctor.nmcRegNo,
      stateMedicalCouncil: pendingDoctor.stateMedicalCouncil,
      hospitalAddress: pendingDoctor.hospitalAddress,
      speciality: pendingDoctor.speciality,
      email: pendingDoctor.email,
      phone: pendingDoctor.phone,
      password: pendingDoctor.password, // Already hashed
      walletAddress: pendingDoctor.walletAddress,
      status: "verified"
    });

    // ✅ Only delete pending record AFTER success
    await PendingDoctor.findByIdAndDelete(pendingDoctorId);

    return res.json({
      message: "Doctor approved successfully",
      doctorId: doctor.doctorId
    });

  } catch (err) {
    console.error("❌ Approve doctor error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 🔹 Reject doctor
exports.rejectDoctor = async (req, res) => {
  try {
    const { pendingDoctorId } = req.params;
    const pendingDoctor = await PendingDoctor.findById(pendingDoctorId);
    if (!pendingDoctor) return res.status(404).json({ error: "Pending doctor not found" });

    await pendingDoctor.deleteOne();
    res.json({ message: "Doctor registration rejected successfully" });
  } catch (err) {
    console.error("❌ Reject doctor error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
