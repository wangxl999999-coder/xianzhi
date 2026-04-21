require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '本地社区二手闲置品交易平台API服务',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常'
  });
});

app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制(最大5MB)'
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传错误'
    });
  }

  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

const multer = require('multer');

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API文档:`);
  console.log(`  - 用户: http://localhost:${PORT}/api/users`);
  console.log(`  - 闲置品: http://localhost:${PORT}/api/items`);
  console.log(`  - 分类: http://localhost:${PORT}/api/categories`);
  console.log(`  - 轮播图: http://localhost:${PORT}/api/banners`);
  console.log(`  - 健康检查: http://localhost:${PORT}/health`);
});
