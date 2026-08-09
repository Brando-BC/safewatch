require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const pacienteRoutes = require('./routes/pacientes');
const signosRoutes = require('./routes/signos');
const alertasRoutes = require('./routes/alertas');
const iaRoutes = require('./routes/ia');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.json({
        nombre: 'SAFEWATCH API',
        version: '1.0.0',
        estado: '🟢 Online'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/signos', signosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ia', iaRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('═══════════════════════════════════');
    console.log('🟢 SAFEWATCH API CORRIENDO');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('═══════════════════════════════════');
});