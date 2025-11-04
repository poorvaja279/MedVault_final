const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

// POST => Save Contact Query
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newMsg = new Contact({ name, email, message });
    await newMsg.save();

    res.json({
      success: true,
      message: "Your message has been received ✅"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});

// ✅ (Optional for viva) — View messages (to show you stored data)
router.get("/", async (req, res) => {
  const msgs = await Contact.find().sort({ date: -1 });
  res.json(msgs);
});

module.exports = router;
