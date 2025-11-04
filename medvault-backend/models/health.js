const mongoose = require("mongoose");

const healthDataSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  systolic: Number,
  diastolic: Number,
  weight: Number,
  bloodSugar: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HealthData", healthDataSchema);
