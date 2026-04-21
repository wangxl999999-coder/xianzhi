const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `img_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({
      code: 500,
      message: '上传失败'
    });
  }
};

const uploadMultipleImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const images = req.files.map(file => ({
      filename: file.filename,
      url: `${baseUrl}/uploads/${file.filename}`,
      size: file.size
    }));

    res.json({
      code: 200,
      message: '上传成功',
      data: images
    });
  } catch (error) {
    console.error('批量上传图片错误:', error);
    res.status(500).json({
      code: 500,
      message: '上传失败'
    });
  }
};

module.exports = {
  upload,
  uploadImage,
  uploadMultipleImages
};
