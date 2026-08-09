const axios = require('axios');

class WhatsAppService {
    async enviarAlerta(datosPaciente, tipoAlerta, signos, ubicacion, motivo, diagnosticos, medicacion) {
        try {
            const mensaje = this.formatearMensaje(datosPaciente, tipoAlerta, signos, ubicacion, motivo, diagnosticos, medicacion);

            const response = await axios.get('https://api.callmebot.com/whatsapp.php', {
                params: {
                    phone: process.env.CALLMEBOT_PHONE,
                    text: mensaje,
                    apikey: process.env.CALLMEBOT_API_KEY
                }
            });

            console.log('WhatsApp enviado');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error WhatsApp:', error.message);
            return { success: false, error: error.message };
        }
    }

    formatearMensaje(datosPaciente, tipoAlerta, signos, ubicacion, motivo, diagnosticos, medicacion) {
        const emojis = {
            caida: '🆘',
            emergencia: '🚨',
            signos_alterados: '⚠️'
        };

        let mensaje = `${emojis[tipoAlerta] || '🚨'} *ALERTA SAFEWATCH*\n\n`;

        mensaje += `👵 *Paciente:* ${datosPaciente.nombre}\n`;
        mensaje += `📅 *Edad:* ${datosPaciente.edad || 'N/A'} años\n`;
        mensaje += `🩸 *Tipo de sangre:* ${datosPaciente.tipo_sangre || 'N/A'}\n`;

        if (datosPaciente.alergias && datosPaciente.alergias !== 'Ninguna registrada') {
            mensaje += `🚫 *Alergias:* ${datosPaciente.alergias}\n`;
        }

        mensaje += `⚠️ *Evento:* ${tipoAlerta}\n\n`;

        mensaje += `📊 *Signos Vitales:*\n`;
        mensaje += `💓 Ritmo cardíaco: ${signos?.ritmo_cardiaco || 'N/A'} lpm\n`;
        mensaje += `🫁 Oxígeno: ${signos?.oxigeno_sangre || signos?.oxigeno || 'N/A'}%\n`;
        mensaje += `🌡️ Temperatura: ${signos?.temperatura || 'N/A'}°C\n\n`;

        if (motivo) {
            mensaje += `🩺 *Diagnóstico:* ${motivo}\n\n`;
        }

        if (diagnosticos && diagnosticos !== 'Ninguno' && diagnosticos !== 'Ninguno registrado') {
            mensaje += `🏥 *Historial médico:* ${diagnosticos}\n\n`;
        }

        if (medicacion && medicacion !== 'No configurada') {
            mensaje += `💊 *Medicación:* ${medicacion}\n\n`;
        }

        if (ubicacion && ubicacion.lat) {
            mensaje += `📍 *Ubicación:*\n`;
            mensaje += `https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lon}\n\n`;
        }

        mensaje += `⏰ *Hora:* ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}\n\n`;
        mensaje += `_SAFEWATCH - Cuidando en cada momento_`;

        return mensaje;
    }
}

module.exports = new WhatsAppService();