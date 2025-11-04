// backend/routes/records.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const recordsController = require('../controllers/records.controller');
const auth = require('../middlewares/authMiddleware'); // your JWT/auth middleware

// Configure multer for in-memory upload
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only PDF and image files are allowed!'), false);
  }
};
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

//router.post('/upload', auth(), upload.single('file'), recordsController.upload);
router.post('/upload', auth(), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, recordsController.upload);

//router.get('/:key', auth(), recordsController.download);

// Download file (stream)
router.get('/download/:key', auth(), recordsController.download);

// List patient’s records
router.get('/', auth(), recordsController.list);

//delete records
router.delete("/:key", auth(), recordsController.delete);


module.exports = router;