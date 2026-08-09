let recognition = null;
let escuchando = true;
let modoConversacion = false;
let synth = window.speechSynthesis;
let vozNatural = null;
let estaHablando = false;
let timeoutSilencio = null;
const TIEMPO_SILENCIO = 300000; // 5 minutos

function configurarVozNatural() {
    if (!synth) return;
    const voices = synth.getVoices();
    const vocesEspanol = voices.filter(v => v.lang.includes('es'));
    const vozGoogle = vocesEspanol.find(v => v.name.includes('Google'));
    const vozMicrosoft = vocesEspanol.find(v => v.name.includes('Microsoft'));
    vozNatural = vozGoogle || vozMicrosoft || vocesEspanol[0] || voices[0];
    console.log('Voz:', vozNatural?.name);
}

function pausarMicrofono() {
    if (recognition) try { recognition.stop(); } catch(e) {}
}

function reanudarMicrofono() {
    if (escuchando && recognition) {
        setTimeout(() => { try { recognition.start(); } catch(e) {} }, 300);
    }
}

function resetearTimeoutSilencio() {
    clearTimeout(timeoutSilencio);
    if (modoConversacion) {
        timeoutSilencio = setTimeout(() => {
            modoConversacion = false;
            actualizarEstado('Escuchando... Di "BROCK"', '#00bfa5');
            document.getElementById('btnVoz').innerHTML = '<i class="fas fa-microphone"></i>';
            document.getElementById('btnVoz').style.background = '#ea4335';
        }, TIEMPO_SILENCIO);
    }
}

function initVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        document.getElementById('estadoEscucha').textContent = 'Voz no soportada';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
        if (estaHablando) return;

        const texto = event.results[event.results.length - 1][0].transcript.trim();
        if (!texto) return;

        console.log('Escuchado:', texto);

        if (!modoConversacion) {
            if (texto.toLowerCase().includes('brock') || texto.toLowerCase().includes('brok') || texto.toLowerCase().includes('broc')) {
                activarModoConversacion(texto);
            }
        } else {
            resetearTimeoutSilencio();
            document.getElementById('chatInput').value = texto;
            enviarMensaje();
        }
    };

    recognition.onerror = function(event) {
        if (event.error === 'aborted') return;
        setTimeout(() => {
            if (escuchando && !estaHablando) try { recognition.start(); } catch(e) {}
        }, 1000);
    };

    recognition.onend = function() {
        if (escuchando && !estaHablando) {
            setTimeout(() => { try { recognition.start(); } catch(e) {} }, 300);
        }
    };

    try {
        recognition.start();
        actualizarEstado('Escuchando... Di "BROCK"', '#00bfa5');
        document.getElementById('btnVoz').style.background = '#ea4335';
    } catch(e) {}
}

function activarModoConversacion(texto) {
    modoConversacion = true;
    resetearTimeoutSilencio();

    document.getElementById('btnVoz').style.background = '#00bfa5';
    document.getElementById('btnVoz').innerHTML = '<i class="fas fa-robot"></i>';
    actualizarEstado('BROCK activado', '#00bfa5');

    const partes = texto.toLowerCase().split(/brock|brok|broc/i);
    const mensaje = partes[1] ? partes[1].trim() : '';

    if (mensaje) {
        document.getElementById('chatInput').value = mensaje;
        enviarMensaje();
    } else {
        const saludo = 'Hola, ¿en qué puedo ayudarte?';
        agregarMensajeBot(saludo);
        hablar(saludo);
    }
}

function toggleVoz() {
    escuchando = !escuchando;
    const btnVoz = document.getElementById('btnVoz');

    if (escuchando) {
        reanudarMicrofono();
        btnVoz.innerHTML = '<i class="fas fa-microphone"></i>';
        btnVoz.style.background = '#ea4335';
        actualizarEstado('Escuchando... Di "BROCK"', '#00bfa5');
    } else {
        modoConversacion = false;
        clearTimeout(timeoutSilencio);
        pausarMicrofono();
        btnVoz.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        btnVoz.style.background = '#1a73e8';
        actualizarEstado('Voz pausada', '#aaa');
    }
}

function actualizarEstado(texto, color) {
    const estado = document.getElementById('estadoEscucha');
    estado.textContent = texto;
    estado.style.color = color;
}

function limpiarTexto(texto) {
    return texto
        .replace(/[*_#`~\[\]()]/g, '')
        .replace(/\./g, ', ')
        .replace(/!/g, ', ')
        .replace(/\?/g, ', ')
        .replace(/:/g, ' ')
        .replace(/;/g, ', ')
        .replace(/\n/g, ', ')
        .replace(/\s+/g, ' ')
        .replace(/, ,/g, ',')
        .trim();
}

function hablar(texto) {
    if (!synth) return;

    estaHablando = true;
    pausarMicrofono();
    synth.cancel();

    const textoLimpio = limpiarTexto(texto);

    const utterance = new SpeechSynthesisUtterance(textoLimpio);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    if (vozNatural) utterance.voice = vozNatural;

    utterance.onend = function() {
        estaHablando = false;
        if (modoConversacion) resetearTimeoutSilencio();
        reanudarMicrofono();
    };

    utterance.onerror = function() {
        estaHablando = false;
        reanudarMicrofono();
    };

    synth.speak(utterance);
}

function agregarMensajeBot(texto) {
    const chatMessages = document.getElementById('chatMessages');
    const textoLimpio = limpiarTexto(texto);
    chatMessages.innerHTML += `<div class="mensaje mensaje-bot">${textoLimpio}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    if (synth) {
        synth.onvoiceschanged = configurarVozNatural;
        configurarVozNatural();
    }
    initVoz();
});