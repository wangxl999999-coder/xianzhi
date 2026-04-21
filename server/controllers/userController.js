const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { username, password, nickname, phone, wechat } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20simple%20friendly&image_size=square';

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, nickname, avatar, phone, wechat) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, defaultAvatar, phone, wechat]
    );

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: {
        userId: result.insertId,
        username
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          wechat: user.wechat,
          address: user.address,
          latitude: user.latitude,
          longitude: user.longitude,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.execute(
      'SELECT id, username, nickname, avatar, phone, wechat, address, latitude, longitude, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const user = users[0];

    const [itemsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM items WHERE user_id = ?',
      [userId]
    );

    const [favoritesCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...user,
        itemsCount: itemsCount[0].count,
        favoritesCount: favoritesCount[0].count
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickname, phone, wechat, address, latitude, longitude, avatar } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (wechat !== undefined) {
      updateFields.push('wechat = ?');
      updateValues.push(wechat);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有需要更新的字段'
      });
    }

    updateValues.push(userId);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, updateValues);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getMyItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM items ${whereClause}`;
    const [countResult] = await pool.execute(countSql, params);

    const sql = `
      SELECT 
        i.*,
        c.name as category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(pageSize), parseInt(offset));

    const [items] = await pool.execute(sql, params);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: items,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取我的发布错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  updateUserInfo,
  getMyItems
};
