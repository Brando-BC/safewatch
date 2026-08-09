const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authController = {
    login: async (req, res) => {
        try {
            const { dni, password, rol } = req.body;
            console.log('Intento de login:', { dni, rol });

            if (!dni || !password || !rol) {
                return res.status(400).json({
                    error: 'Faltan datos',
                    message: 'DNI, contraseña y rol son requeridos'
                });
            }

            let usuario;
            const tabla = rol === 'admin' ? 'administradores' : 'pacientes';

            const { data, error } = await supabase
                .from(tabla)
                .select('*')
                .eq('dni', dni)
                .single();

            if (error || !data) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    message: 'Usuario no encontrado'
                });
            }

            usuario = data;
            const passwordValido = await bcrypt.compare(password, usuario.password_hash);

            if (!passwordValido) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    message: 'Contraseña incorrecta'
                });
            }

            const token = jwt.sign(
                {
                    id: usuario.id,
                    dni: usuario.dni,
                    nombre: usuario.nombre_completo,
                    rol: rol
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                token: token,
                usuario: {
                    id: usuario.id,
                    dni: usuario.dni,
                    nombre: usuario.nombre_completo,
                    rol: rol
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    verificar: async (req, res) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ valido: false });

            const verificado = jwt.verify(token, process.env.JWT_SECRET);
            res.json({ valido: true, usuario: verificado });
        } catch (error) {
            res.status(401).json({ valido: false });
        }
    }
};

module.exports = authController;