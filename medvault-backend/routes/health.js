const express = require("express");
const router = express.Router();
const HealthData = require("../models/HealthData");

router.post("/add", async (req, res) => {
  try {
    const { patientId, systolic, diastolic, weight, bloodSugar } = req.body;

    await HealthData.create({ patientId, systolic, diastolic, weight, bloodSugar });

    res.json({ success: true, message: "Health data added ✅" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:patientId", async (req, res) => {
  try {
    const data = await HealthData.find({ patientId: req.params.patientId }).sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
