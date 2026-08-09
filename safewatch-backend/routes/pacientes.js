const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const adminController = require('../controllers/adminController');
const { verificarToken, esAdmin } = require('../middleware/auth');

// Rutas de admin (protegidas)
router.get('/', verificarToken, esAdmin, adminController.obtenerPacientes);
router.post('/', verificarToken, esAdmin, adminController.crearPaciente);
router.put('/:id', verificarToken, esAdmin, adminController.actualizarPaciente);
router.delete('/:id', verificarToken, esAdmin, adminController.eliminarPaciente);

// Ruta para que el paciente actualice su propia foto
router.put('/:id/foto', verificarToken, async (req, res) => {
    try {
        const supabase = require('../config/supabase');
        const { foto_perfil_url } = req.body;
        
        const { data, error } = await supabase
            .from('pacientes')
            .update({ foto_perfil_url })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, paciente: data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Ruta para paciente individual
router.get('/:id/perfil', verificarToken, pacienteController.obtenerUno);

module.exports = router;