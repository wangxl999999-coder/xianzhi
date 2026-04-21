const pool = require('../config/db');

const getCategoryList = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE status = 1 ORDER BY sort_order ASC',
      []
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getCategoryList
};
