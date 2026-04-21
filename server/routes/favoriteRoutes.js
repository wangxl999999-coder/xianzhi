const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/toggle', authenticateToken, favoriteController.toggleFavorite);

router.get('/my', authenticateToken, favoriteController.getMyFavorites);

module.exports = router;
