const pool = require('../config/db');

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        code: 400,
        message: '缺少itemId参数'
      });
    }

    const [items] = await pool.execute(
      'SELECT id FROM items WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '闲置品不存在'
      });
    }

    const [existingFavorites] = await pool.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );

    if (existingFavorites.length > 0) {
      await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );

      await pool.execute(
        'UPDATE items SET favorites_count = favorites_count - 1 WHERE id = ?',
        [itemId]
      );

      res.json({
        code: 200,
        message: '取消收藏成功',
        data: { isFavorite: false }
      });
    } else {
      await pool.execute(
        'INSERT INTO favorites (user_id, item_id) VALUES (?, ?)',
        [userId, itemId]
      );

      await pool.execute(
        'UPDATE items SET favorites_count = favorites_count + 1 WHERE id = ?',
        [itemId]
      );

      res.json({
        code: 200,
        message: '收藏成功',
        data: { isFavorite: true }
      });
    }
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
      [userId]
    );

    const [favorites] = await pool.execute(
      `SELECT 
        i.*,
        u.nickname as publisher_nickname,
        u.avatar as publisher_avatar,
        c.name as category_name,
        f.created_at as favorite_time
      FROM favorites f
      LEFT JOIN items i ON f.item_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), parseInt(offset)]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: favorites,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites
};
