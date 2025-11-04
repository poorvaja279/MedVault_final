const mongoose = require("mongoose");

const HealthDataSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  systolic: Number,
  diastolic: Number,
  weight: Number,
  bloodSugar: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Healthdatas", HealthDataSchema); 
// 👆 MUST MATCH your existing model name
