const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getItemList = async (req, res) => {
  try {
    const { keyword, categoryId, condition, minPrice, maxPrice, sortBy, page = 1, pageSize = 10, latitude, longitude } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE i.status = 1';
    let params = [];
    let orderBy = 'ORDER BY i.created_at DESC';

    if (keyword) {
      whereClause += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (categoryId) {
      whereClause += ' AND i.category_id = ?';
      params.push(categoryId);
    }

    if (condition) {
      whereClause += ' AND i.condition = ?';
      params.push(condition);
    }

    if (minPrice) {
      whereClause += ' AND i.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      whereClause += ' AND i.price <= ?';
      params.push(maxPrice);
    }

    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          orderBy = 'ORDER BY i.price ASC';
          break;
        case 'price_desc':
          orderBy = 'ORDER BY i.price DESC';
          break;
        case 'newest':
          orderBy = 'ORDER BY i.created_at DESC';
          break;
        case 'views':
          orderBy = 'ORDER BY i.views DESC';
          break;
        case 'distance':
          if (latitude && longitude) {
            orderBy = 'ORDER BY distance ASC';
          }
          break;
        default:
          orderBy = 'ORDER BY i.created_at DESC';
      }
    }

    const distanceField = latitude && longitude
      ? `, ST_Distance_Sphere(POINT(${longitude}, ${latitude}), POINT(i.longitude, i.latitude)) as distance`
      : '';

    const countSql = `SELECT COUNT(*) as total FROM items i ${whereClause}`;
    const [countResult] = await pool.execute(countSql, params);

    const sql = `
      SELECT 
        i.*,
        u.nickname as publisher_nickname,
        u.avatar as publisher_avatar,
        c.name as category_name
        ${distanceField}
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(pageSize), parseInt(offset)];
    const [items] = await pool.execute(sql, queryParams);

    const itemsWithDistance = items.map(item => {
      if (item.distance !== undefined) {
        item.distance = item.distance / 1000;
      }
      return item;
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: itemsWithDistance,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取闲置品列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getItemDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;

    const [items] = await pool.execute(
      `SELECT 
        i.*,
        u.id as publisher_id,
        u.nickname as publisher_nickname,
        u.avatar as publisher_avatar,
        u.phone as publisher_phone,
        u.wechat as publisher_wechat,
        u.address as publisher_address,
        u.created_at as publisher_created_at,
        c.name as category_name
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '闲置品不存在'
      });
    }

    const item = items[0];

    await pool.execute(
      'UPDATE items SET views = views + 1 WHERE id = ?',
      [id]
    );

    let isFavorite = false;
    if (userId) {
      const [favorites] = await pool.execute(
        'SELECT id FROM favorites WHERE user_id = ? AND item_id = ?',
        [userId, id]
      );
      isFavorite = favorites.length > 0;
    }

    const [otherItems] = await pool.execute(
      `SELECT id, title, price, images, created_at 
       FROM items 
       WHERE user_id = ? AND id != ? AND status = 1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [item.publisher_id, id]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...item,
        isFavorite,
        otherItems
      }
    });
  } catch (error) {
    console.error('获取闲置品详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { title, description, price, originalPrice, condition, categoryId, pickupMethod, phone, wechat, images, address, latitude, longitude } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO items 
       (user_id, title, description, price, original_price, \`condition\`, category_id, pickup_method, phone, wechat, images, address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description, price, originalPrice, condition, categoryId, pickupMethod, phone, wechat, JSON.stringify(images || []), address, latitude, longitude]
    );

    res.status(201).json({
      code: 200,
      message: '发布成功',
      data: {
        itemId: result.insertId
      }
    });
  } catch (error) {
    console.error('发布闲置品错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, price, originalPrice, condition, categoryId, pickupMethod, phone, wechat, images, address, latitude, longitude, status } = req.body;

    const [items] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '闲置品不存在或无权修改'
      });
    }

    let updateFields = [];
    let updateValues = [];

    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (price !== undefined) { updateFields.push('price = ?'); updateValues.push(price); }
    if (originalPrice !== undefined) { updateFields.push('original_price = ?'); updateValues.push(originalPrice); }
    if (condition !== undefined) { updateFields.push('`condition` = ?'); updateValues.push(condition); }
    if (categoryId !== undefined) { updateFields.push('category_id = ?'); updateValues.push(categoryId); }
    if (pickupMethod !== undefined) { updateFields.push('pickup_method = ?'); updateValues.push(pickupMethod); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (wechat !== undefined) { updateFields.push('wechat = ?'); updateValues.push(wechat); }
    if (images !== undefined) { updateFields.push('images = ?'); updateValues.push(JSON.stringify(images)); }
    if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address); }
    if (latitude !== undefined) { updateFields.push('latitude = ?'); updateValues.push(latitude); }
    if (longitude !== undefined) { updateFields.push('longitude = ?'); updateValues.push(longitude); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有需要更新的字段'
      });
    }

    updateValues.push(id, userId);

    const sql = `UPDATE items SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    await pool.execute(sql, updateValues);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新闲置品错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [items] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '闲置品不存在或无权删除'
      });
    }

    await pool.execute(
      'DELETE FROM items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除闲置品错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getItemList,
  getItemDetail,
  createItem,
  updateItem,
  deleteItem
};
