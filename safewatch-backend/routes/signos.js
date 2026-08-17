const express = require('express');
const router = express.Router();
const signosController = require('../controllers/signosController');
const { verificarToken } = require('../middleware/auth');

router.get('/:paciente_id', verificarToken, signosController.obtenerSignos);
router.post('/', signosController.insertarSignos);

module.exports = router;