const express = require("express");
const router = express.Router();
const HealthData = require("../models/HealthData"); // ✅ correct file

// Add health entry
router.post("/add", async (req, res) => {
  try {
    const { patientId, systolic, diastolic, weight, bloodSugar } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: "patientId required" });
    }

    const record = new HealthData({
      patientId,
      systolic,
      diastolic,
      weight,
      bloodSugar
    });

    await record.save();
    res.json({ message: "Health record saved ✅" });

  } catch (err) {
    console.error("Error saving health data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all health records for patient
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const data = await HealthData.find({ patientId }).sort({ date: 1 });

    res.json(data);
  } catch (err) {
    console.error("Error fetching health data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
