const express = require('express');
const { body } = require('express-validator');
const itemController = require('../controllers/itemController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', itemController.getItemList);

router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, () => {
      itemController.getItemDetail(req, res);
    });
  } else {
    itemController.getItemDetail(req, res);
  }
});

router.post('/',
  authenticateToken,
  [
    body('title').isLength({ min: 2, max: 100 }).withMessage('标题长度必须在2-100个字符之间'),
    body('price').isFloat({ min: 0 }).withMessage('价格必须是大于等于0的数字'),
    body('description').isLength({ max: 2000 }).withMessage('描述长度不能超过2000个字符')
  ],
  itemController.createItem
);

router.put('/:id',
  authenticateToken,
  itemController.updateItem
);

router.delete('/:id',
  authenticateToken,
  itemController.deleteItem
);

module.exports = router;
