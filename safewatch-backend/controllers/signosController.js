const supabase = require('../config/supabase');

const signosController = {
    obtenerSignos: async (req, res) => {
        const { data, error } = await supabase
            .from('signos_vitales')
            .select('*')
            .eq('paciente_id', req.params.paciente_id)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    },

    insertarSignos: async (req, res) => {
        const { data, error } = await supabase
            .from('signos_vitales')
            .insert(req.body)
            .select();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    }
};

module.exports = signosController;