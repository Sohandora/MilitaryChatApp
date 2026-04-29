const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'military-chat',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'],
      public_id: `${Date.now()}-${file.originalname}`
    };
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ── UPLOAD FILE ──
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '❌ No file uploaded.' });
    }

    res.status(200).json({
      message: '✅ File uploaded!',
      url: req.file.path,
      originalName: req.file.originalname,
      fileType: req.file.mimetype
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Upload failed.', error: err.message });
  }
});

module.exports = router;