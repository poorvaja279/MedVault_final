const express = require("express");
const router = express.Router();
const Health = require("../models/Health");

// Add entry
router.post("/add", async (req, res) => {
  try {
    const health = new Health(req.body);
    await health.save();
    res.json({ message: "Data saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error saving health data" });
  }
});

// Get all entries for a patient
router.get("/:patientId", async (req, res) => {
  try {
    const data = await Health.find({ patientId: req.params.patientId }).sort({ date: 1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching data" });
  }
});

module.exports = router;
