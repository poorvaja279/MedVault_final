const mongoose = require("mongoose");

const ApprovalSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  approvedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Approval", ApprovalSchema);
