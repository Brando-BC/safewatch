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

        // NUEVO: Si no llega ubicación, buscar la última guardada
        let ubicacionFinal = ubicacion || null;
        if (!ubicacionFinal) {
            const { data: ubicacionData } = await supabase
                .from('ubicacion_paciente')
                .select('lat, lon')
                .eq('paciente_id', paciente_id)
                .order('actualizada_en', { ascending: false })
                .limit(1)
                .single();
            if (ubicacionData) {
                ubicacionFinal = { 
                    lat: parseFloat(ubicacionData.lat), 
                    lon: parseFloat(ubicacionData.lon) 
                };
                console.log('Ubicación guardada encontrada:', ubicacionFinal);
            }
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
                ubicacion_lat: ubicacionFinal?.lat || null,
                ubicacion_lon: ubicacionFinal?.lon || null
            })
            .select()
            .single();

        if (errorAlerta) {
            return res.status(500).json({ error: 'Error guardando alerta' });
        }

        // Enviar WhatsApp con ubicación correcta
        const datosPaciente = {
            nombre: paciente.nombre_completo,
            edad: paciente.edad,
            tipo_sangre: paciente.tipo_sangre,
            alergias: paciente.alergias,
            diagnosticos: paciente.diagnosticos?.join(', '),
            medicacion: paciente.medicacion_actual
        };

        const resultado = await WhatsAppService.enviarAlerta(
            datosPaciente,
            tipo || 'emergencia',
            signos || {},
            ubicacionFinal
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