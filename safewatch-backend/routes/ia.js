const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { verificarToken } = require('../middleware/auth');

router.post('/chat', verificarToken, iaController.chat);

module.exports = router;