const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/register',
  [
    body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度必须在2-50个字符之间'),
    body('password').isLength({ min: 6, max: 20 }).withMessage('密码长度必须在6-20个字符之间')
  ],
  userController.register
);

router.post('/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  userController.login
);

router.get('/info', authenticateToken, userController.getUserInfo);

router.put('/info', authenticateToken, userController.updateUserInfo);

router.get('/my-items', authenticateToken, userController.getMyItems);

module.exports = router;
