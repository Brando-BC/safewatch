const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const WhatsAppService = require('../services/whatsappService');
const { verificarToken } = require('../middleware/auth');

// Obtener alertas de un paciente
router.get('/:paciente_id', verificarToken, async (req, res) => {
    const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .eq('paciente_id', req.params.paciente_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// CREAR ALERTA Y ENVIAR WHATSAPP
router.post('/enviar', async (req, res) => {
    try {
        const { paciente_id, tipo, signos, ubicacion } = req.body;

        // Buscar datos del paciente
        const { data: paciente, error: errorPaciente } = await supabase
            .from('pacientes')
            .select('*, contactos_emergencia(*)')
            .eq('id', paciente_id)
            .single();

        if (errorPaciente || !paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Guardar alerta en la base de datos
        const { data: alerta, error: errorAlerta } = await supabase
            .from('alertas')
            .insert({
                paciente_id,
                tipo: tipo || 'emergencia',
                gravedad: 'alta',
                mensaje: `Alerta de ${tipo} detectada`,
                signos_snapshot: signos || {},
                ubicacion_lat: ubicacion?.lat || null,
                ubicacion_lon: ubicacion?.lon || null
            })
            .select()
            .single();

        if (errorAlerta) {
            return res.status(500).json({ error: 'Error guardando alerta' });
        }

        // Enviar WhatsApp al contacto de emergencia
        const datosPaciente = {
            nombre: paciente.nombre_completo,
            edad: paciente.edad
        };

        const resultado = await WhatsAppService.enviarAlerta(
            datosPaciente,
            tipo || 'emergencia',
            signos || {},
            ubicacion
        );

        res.json({
            success: true,
            mensaje: 'Alerta enviada',
            alerta: alerta,
            whatsapp: resultado
        });

    } catch (error) {
        console.error('Error enviando alerta:', error);
        res.status(500).json({ error: 'Error al enviar alerta' });
    }
});

module.exports = router;