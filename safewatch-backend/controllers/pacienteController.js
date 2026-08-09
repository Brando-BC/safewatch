const supabase = require('../config/supabase');

const pacienteController = {
    obtenerTodos: async (req, res) => {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    },

    obtenerUno: async (req, res) => {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Paciente no encontrado' });
        res.json(data);
    }
};

module.exports = pacienteController;