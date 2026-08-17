const express = require('express');
const router = express.Router();
const signosController = require('../controllers/signosController');
const { verificarToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

router.get('/:paciente_id', verificarToken, signosController.obtenerSignos);
router.post('/', signosController.insertarSignos);

router.post('/ubicacion', verificarToken, async (req, res) => {
    try {
        const { paciente_id, lat, lon } = req.body;
        console.log('Guardando ubicación:', { paciente_id, lat, lon });

        const { data, error } = await supabase
            .from('ubicacion_paciente')
            .upsert({ paciente_id, lat, lon, actualizada_en: new Date() }, { onConflict: 'paciente_id' });

        if (error) {
            console.log('Error Supabase:', error.message);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (e) {
        console.log('Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;