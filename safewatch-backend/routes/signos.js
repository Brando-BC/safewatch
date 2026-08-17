const express = require('express');
const router = express.Router();
const signosController = require('../controllers/signosController');
const { verificarToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

router.get('/:paciente_id', verificarToken, signosController.obtenerSignos);
router.post('/', signosController.insertarSignos);

// NUEVO: Guardar ubicación del paciente
router.post('/ubicacion', verificarToken, async (req, res) => {
    try {
        const { paciente_id, lat, lon } = req.body;

        const { data, error } = await supabase
            .from('ubicacion_paciente')
            .upsert({ paciente_id, lat, lon, actualizada_en: new Date() }, { onConflict: 'paciente_id' });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;