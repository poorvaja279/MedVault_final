const mongoose = require("mongoose");

const HealthSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  systolic: Number,
  diastolic: Number,
  weight: Number,
  bloodSugar: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Health", HealthSchema);
