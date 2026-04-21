const pool = require('../config/db');

const getBannerList = async (req, res) => {
  try {
    const [banners] = await pool.execute(
      'SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC',
      []
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: banners
    });
  } catch (error) {
    console.error('获取轮播图列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getBannerList
};
