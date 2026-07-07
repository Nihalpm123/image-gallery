const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageController = require('../controllers/imageController');
const auth = require('../middleware/auth');

// Configure dynamic storage (Vercel memory buffer or Local disk storage)
const useCloudStorage = !!process.env.BLOB_READ_WRITE_TOKEN;

let storage;

if (useCloudStorage) {
  storage = multer.memoryStorage();
} else {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
}

// Configure Multer File Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Format rejected. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Public image routes
router.get('/', imageController.getImages);
router.get('/:id', imageController.getImageById);

// Admin-guarded image routes
router.post('/', auth, upload.single('image'), imageController.createImage);
router.put('/:id', auth, imageController.updateImage);
router.delete('/:id', auth, imageController.deleteImage);

module.exports = router;
