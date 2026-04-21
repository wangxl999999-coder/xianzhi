const express = require('express');
const uploadController = require('../controllers/uploadController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/image',
  authenticateToken,
  uploadController.upload.single('image'),
  uploadController.uploadImage
);

router.post('/images',
  authenticateToken,
  uploadController.upload.array('images', 9),
  uploadController.uploadMultipleImages
);

module.exports = router;
