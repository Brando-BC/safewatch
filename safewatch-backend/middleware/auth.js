const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            error: 'Acceso denegado',
            message: 'No se proporciono token'
        });
    }

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Token invalido',
            message: 'El token ha expirado o es invalido'
        });
    }
};

const esAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Se requieren permisos de administrador'
        });
    }
    next();
};

module.exports = { verificarToken, esAdmin };