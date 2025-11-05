const express = require("express");
const router = express.Router();
const Approval = require("../models/Approval");
const auth = require("../middlewares/authMiddleware")(["patient"]);

router.post("/save", auth, async (req, res) => {
  try {
    const { doctorId } = req.body;

    await Approval.create({
      patientId: req.user.id,
      doctorId,
      approvedOn: new Date()
    });

    res.json({ message: "Saved approval date ✅" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
