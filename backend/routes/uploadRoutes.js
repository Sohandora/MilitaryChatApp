const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { verifyToken } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage instead of CloudinaryStorage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── UPLOAD FILE ──
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '❌ No file uploaded.' });
    }

    // Upload to Cloudinary via stream
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'military-chat',
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(req.file.buffer).pipe(stream);
      });

    const result = await uploadToCloudinary();

    res.status(200).json({
      message: '✅ File uploaded!',
      url: result.secure_url,
      originalName: req.file.originalname,
      fileType: req.file.mimetype
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Upload failed.', error: err.message });
  }
});

module.exports = router;