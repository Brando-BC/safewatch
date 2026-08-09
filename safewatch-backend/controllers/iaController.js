const fetch = require('node-fetch');
const IAService = require('../services/iaService');
const WhatsAppService = require('../services/whatsappService');
const supabase = require('../config/supabase');

const iaController = {
    chat: async (req, res) => {
        try {
            const { mensaje, paciente_id, ubicacion } = req.body;

            const { data: paciente } = await supabase
                .from('pacientes')
                .select('*')
                .eq('id', paciente_id)
                .single();

            const { data: signos } = await supabase
                .from('signos_vitales')
                .select('*')
                .eq('paciente_id', paciente_id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            const { data: historial } = await supabase
                .from('conversaciones_ia')
                .select('mensaje_usuario, respuesta_ia')
                .eq('paciente_id', paciente_id)
                .order('created_at', { ascending: false })
                .limit(5);

            const historialFormateado = [];
            historial.reverse().forEach(h => {
                historialFormateado.push({ role: 'user', content: h.mensaje_usuario });
                historialFormateado.push({ role: 'assistant', content: h.respuesta_ia });
            });

            const datosPaciente = {
                nombre: paciente.nombre_completo, edad: paciente.edad, peso: paciente.peso,
                tipo_sangre: paciente.tipo_sangre, alergias: paciente.alergias,
                diagnosticos: paciente.diagnosticos?.join(', '), medicacion: paciente.medicacion_actual,
                ritmo_cardiaco: signos?.ritmo_cardiaco, oxigeno: signos?.oxigeno_sangre,
                temperatura: signos?.temperatura, ubicacion: ubicacion || null
            };

            // PREGUNTA POR UBICACIÓN CON GEOCODIFICACIÓN INVERSA
            const preguntasUbicacion = ['donde estoy', 'ubicacion', 'ubicación', 'donde me encuentro', 'mi ubicacion', 'sabes donde estoy', 'mi posicion', 'coordenadas', 'lugar donde estoy', 'que calle', 'direccion', 'dirección'];
            const quiereUbicacion = preguntasUbicacion.some(p => mensaje.toLowerCase().includes(p));

            if (quiereUbicacion && ubicacion) {
                let direccion = '';
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ubicacion.lat}&lon=${ubicacion.lon}&accept-language=es&zoom=18`, {
                    headers: { 'User-Agent': 'SAFEWATCH/1.0 (contacto@safewatch.com)' }});
                    const geoData = await geoRes.json();
                    if (geoData && geoData.display_name) {
                        direccion = geoData.display_name;
                    }
                } catch (e) {
                    console.log('Error geocodificación:', e.message);
                }

                const respuesta = direccion
                    ? `Te encuentras en: ${direccion}. Puedes ver tu ubicacion exacta en el mapa de tu panel.`
                    : `Estas cerca de latitud ${ubicacion.lat.toFixed(6)}, longitud ${ubicacion.lon.toFixed(6)}. Revisa el mapa en tu panel.`;

                await supabase.from('conversaciones_ia').insert({
                    paciente_id, mensaje_usuario: mensaje, respuesta_ia: respuesta
                });

                return res.json({ success: true, respuesta, es_emergencia: false });
            }

            if (quiereUbicacion && !ubicacion) {
                const respuesta = 'No tengo acceso a tu ubicacion en este momento. Asegurate de tener el GPS activado y los permisos de ubicacion en tu navegador.';
                await supabase.from('conversaciones_ia').insert({ paciente_id, mensaje_usuario: mensaje, respuesta_ia: respuesta });
                return res.json({ success: true, respuesta, es_emergencia: false });
            }

            // EMERGENCIAS
            const emergencias = [
                { palabras: ['me cai', 'me caí', 'caida', 'caída', 'me tropece'], diagnostico: 'Posible caida con riesgo de fractura', tipo: 'caida' },
                { palabras: ['no puedo respirar', 'me ahogo', 'me falta el aire', 'no respiro'], diagnostico: 'Posible insuficiencia respiratoria aguda', tipo: 'emergencia' },
                { palabras: ['me duele el pecho', 'dolor en el pecho', 'opresion', 'infarto'], diagnostico: 'Posible sindrome coronario agudo', tipo: 'emergencia' },
                { palabras: ['estoy sangrando', 'sangrado', 'hemorragia', 'sangre'], diagnostico: 'Hemorragia activa', tipo: 'emergencia' },
                { palabras: ['no me puedo mover', 'no siento el brazo', 'no siento la pierna', 'paralisis'], diagnostico: 'Posible ACV', tipo: 'emergencia' },
                { palabras: ['convulsion', 'convulsión', 'ataque epileptico'], diagnostico: 'Posible crisis convulsiva', tipo: 'emergencia' },
                { palabras: ['me desmaye', 'desmayo', 'perdi el conocimiento'], diagnostico: 'Posible sincope', tipo: 'emergencia' },
                { palabras: ['dolor de cabeza intenso', 'migraña fuerte'], diagnostico: 'Cefalea intensa', tipo: 'emergencia' }
            ];

            let signosAlterados = false, diagSignos = '';
            if (signos) {
                if (signos.ritmo_cardiaco < 50) { signosAlterados = true; diagSignos = 'Bradicardia severa (' + signos.ritmo_cardiaco + ' lpm)'; }
                else if (signos.ritmo_cardiaco > 120) { signosAlterados = true; diagSignos = 'Taquicardia severa (' + signos.ritmo_cardiaco + ' lpm)'; }
                if (signos.oxigeno_sangre < 90) { signosAlterados = true; diagSignos += ' Hipoxemia (' + signos.oxigeno_sangre + '%)'; }
                if (signos.temperatura > 38.5) { signosAlterados = true; diagSignos += ' Hipertermia (' + signos.temperatura + 'C)'; }
            }

            let esEmergencia = false, diagnosticoFinal = '', tipoAlerta = 'emergencia';
            for (const em of emergencias) {
                if (em.palabras.some(p => mensaje.toLowerCase().includes(p))) {
                    esEmergencia = true; diagnosticoFinal = em.diagnostico; tipoAlerta = em.tipo; break;
                }
            }
            if (signosAlterados && !esEmergencia) { esEmergencia = true; diagnosticoFinal = diagSignos; tipoAlerta = 'signos_alterados'; }

            if (esEmergencia) {
                console.log('EMERGENCIA:', diagnosticoFinal);
                await supabase.from('alertas').insert({
                    paciente_id, tipo: tipoAlerta, gravedad: 'alta',
                    mensaje: diagnosticoFinal + '. Paciente refiere: ' + mensaje,
                    signos_snapshot: signos || {}, whatsapp_enviado: true
                });

                await WhatsAppService.enviarAlerta(datosPaciente, tipoAlerta, {
                    ritmo_cardiaco: signos?.ritmo_cardiaco || 'N/A',
                    oxigeno_sangre: signos?.oxigeno_sangre || 'N/A',
                    temperatura: signos?.temperatura || 'N/A'
                }, ubicacion || null, diagnosticoFinal + '. Paciente refiere: ' + mensaje, datosPaciente.diagnosticos, datosPaciente.medicacion);

                await supabase.from('conversaciones_ia').insert({
                    paciente_id, mensaje_usuario: mensaje, respuesta_ia: 'Alerta enviada. Diagnostico: ' + diagnosticoFinal
                });

                return res.json({
                    success: true,
                    respuesta: 'He enviado una alerta a tu familiar. Diagnostico: ' + diagnosticoFinal + '. Manten la calma.',
                    es_emergencia: true
                });
            }

            const respuestaIA = await IAService.chat(mensaje, historialFormateado, datosPaciente);
            await supabase.from('conversaciones_ia').insert({ paciente_id, mensaje_usuario: mensaje, respuesta_ia: respuestaIA.respuesta });
            res.json({ success: true, respuesta: respuestaIA.respuesta, es_emergencia: false });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Error al procesar mensaje' });
        }
    }
};

module.exports = iaController;