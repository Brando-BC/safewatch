const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const adminController = {
    // Obtener todos los pacientes
    obtenerPacientes: async (req, res) => {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    },

    // Crear paciente
    crearPaciente: async (req, res) => {
        try {
            const {
                dni, password, nombre_completo, fecha_nacimiento,
                peso, altura, tipo_sangre, alergias, medicacion_actual, diagnosticos
            } = req.body;

            const password_hash = await bcrypt.hash(password || 'safewatch2024', 10);

            const { data, error } = await supabase
                .from('pacientes')
                .insert({
                    dni,
                    password_hash,
                    nombre_completo,
                    fecha_nacimiento,
                    edad: fecha_nacimiento ? Math.floor((new Date() - new Date(fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
                    peso: parseFloat(peso) || null,
                    altura: parseFloat(altura) || null,
                    tipo_sangre,
                    alergias,
                    medicacion_actual,
                    diagnosticos: diagnosticos ? diagnosticos.split(',').map(d => d.trim()) : []
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return res.status(400).json({ error: 'El DNI ya existe' });
                }
                return res.status(500).json({ error: error.message });
            }

            res.status(201).json({ success: true, paciente: data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar paciente
    actualizarPaciente: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                dni, password, nombre_completo, fecha_nacimiento,
                peso, altura, tipo_sangre, alergias, medicacion_actual, diagnosticos
            } = req.body;

            const updates = {
                dni,
                nombre_completo,
                fecha_nacimiento,
                edad: fecha_nacimiento ? Math.floor((new Date() - new Date(fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
                peso: parseFloat(peso) || null,
                altura: parseFloat(altura) || null,
                tipo_sangre,
                alergias,
                medicacion_actual,
                diagnosticos: diagnosticos ? diagnosticos.split(',').map(d => d.trim()) : []
            };

            if (password) {
                updates.password_hash = await bcrypt.hash(password, 10);
            }

            const { data, error } = await supabase
                .from('pacientes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) return res.status(500).json({ error: error.message });
            res.json({ success: true, paciente: data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Eliminar paciente
    eliminarPaciente: async (req, res) => {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, message: 'Paciente eliminado' });
    }
};

module.exports = adminController;