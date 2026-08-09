const API_URL = 'https://safewatch-backend-9rq6.onrender.com/api';
const token = localStorage.getItem('safewatch_token');
const userData = JSON.parse(localStorage.getItem('safewatch_user') || '{}');

if (!token) window.location.href = '../index.html';

async function cargarDatosCompletos() {
    try {
        const response = await fetch(`${API_URL}/pacientes/${userData.id}/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const paciente = await response.json();

        userData.edad = paciente.edad;
        userData.peso = paciente.peso;
        userData.altura = paciente.altura;
        userData.tipo_sangre = paciente.tipo_sangre;
        userData.alergias = paciente.alergias;
        userData.foto_perfil = paciente.foto_perfil_url;
        localStorage.setItem('safewatch_user', JSON.stringify(userData));

        document.getElementById('perfilNombre').textContent = paciente.nombre_completo || 'Paciente';
        document.getElementById('perfilDni').textContent = 'DNI: ' + (paciente.dni || '--');
        document.getElementById('infoEdad').textContent = paciente.edad || '--';
        document.getElementById('infoPeso').textContent = (paciente.peso || '--') + ' kg';
        document.getElementById('infoAltura').textContent = (paciente.altura || '--') + ' m';
        document.getElementById('infoSangre').textContent = paciente.tipo_sangre || '--';
        document.getElementById('infoAlergias').textContent = paciente.alergias || 'Ninguna';

        if (paciente.foto_perfil_url) {
            document.getElementById('avatarImg').src = paciente.foto_perfil_url;
            document.getElementById('avatarImg').style.display = 'block';
            document.getElementById('avatarInicial').style.display = 'none';
        }

        return paciente;
    } catch (e) {
        document.getElementById('perfilNombre').textContent = userData.nombre || 'Paciente';
        document.getElementById('perfilDni').textContent = 'DNI: ' + (userData.dni || '--');
        return userData;
    }
}

async function cargarDashboard() {
    document.getElementById('nombreUsuario').textContent = userData.nombre || 'Paciente';
    document.getElementById('avatarInicial').textContent = (userData.nombre || 'P')[0].toUpperCase();

    const datos = await cargarDatosCompletos();

    try {
        const response = await fetch(`${API_URL}/signos/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const signos = await response.json();
        if (signos.length > 0) {
            const ultimo = signos[0];
            document.getElementById('ritmoCardiaco').innerHTML = (ultimo.ritmo_cardiaco || '--') + '<span class="vital-unit"> lpm</span>';
            document.getElementById('oxigeno').innerHTML = (ultimo.oxigeno_sangre || '--') + '<span class="vital-unit">%</span>';
            document.getElementById('temperatura').innerHTML = (ultimo.temperatura || '--') + '<span class="vital-unit">°C</span>';
        }
    } catch (e) {}

    if (datos.foto_perfil_url || userData.foto_perfil) {
        const foto = datos.foto_perfil_url || userData.foto_perfil;
        document.getElementById('avatarImg').src = foto;
        document.getElementById('avatarImg').style.display = 'block';
        document.getElementById('avatarInicial').style.display = 'none';
    }
}

async function enviarMensaje() {
    const input = document.getElementById('chatInput');
    const mensaje = input.value.trim();
    if (!mensaje) return;

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += `
        <div class="msg user">
            <div class="msg-avatar"><i class="fas fa-user"></i></div>
            <div class="msg-bubble">${mensaje}</div>
        </div>`;
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_URL}/ia/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                mensaje, 
                paciente_id: userData.id,
                ubicacion: window.ultimaUbicacion || null
            })
        });
        const data = await response.json();
        chatMessages.innerHTML += `
            <div class="msg bot">
                <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                <div class="msg-bubble">${data.respuesta}</div>
            </div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (typeof hablar === 'function') hablar(data.respuesta);
    } catch (e) {
        chatMessages.innerHTML += `
            <div class="msg bot">
                <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                <div class="msg-bubble">Error de conexión.</div>
            </div>`;
    }
}

async function enviarAlertaEmergencia() {
    const btn = document.getElementById('btnEmergencia');
    btn.textContent = '⏳ Enviando...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/signos/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const signos = await res.json();
        const ultimo = signos[0] || {};
        const ubicacion = window.ultimaUbicacion || { lat: -12.0464, lon: -77.0428 };

        const response = await fetch(`${API_URL}/alertas/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paciente_id: userData.id,
                tipo: 'emergencia',
                signos: {
                    ritmo_cardiaco: ultimo.ritmo_cardiaco,
                    oxigeno_sangre: ultimo.oxigeno_sangre,
                    temperatura: ultimo.temperatura
                },
                ubicacion: { lat: ubicacion.lat, lon: ubicacion.lon }
            })
        });
        const data = await response.json();
        alert(data.success ? '✅ Alerta enviada' : '❌ Error');
        btn.textContent = data.success ? '✅ Enviada' : '🆘 ALERTA DE EMERGENCIA';
    } catch (e) {
        alert('❌ Error');
    } finally {
        btn.disabled = false;
    }
}

async function subirFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const max = 200;
                    let w = img.width, h = img.height;
                    if (w > h && w > max) { h *= max/w; w = max; }
                    else if (h > max) { w *= max/h; h = max; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        const response = await fetch(`${API_URL}/pacientes/${userData.id}/foto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ foto_perfil_url: base64 })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('avatarImg').src = base64;
            document.getElementById('avatarImg').style.display = 'block';
            document.getElementById('avatarInicial').style.display = 'none';
            userData.foto_perfil = base64;
            localStorage.setItem('safewatch_user', JSON.stringify(userData));
        }
    } catch (e) {
        alert('❌ Error');
    }
}

function iniciarActualizacionTiempoReal() {
    setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/signos/${userData.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const signos = await response.json();
            if (signos.length > 0) {
                const u = signos[0];
                document.getElementById('ritmoCardiaco').innerHTML = (u.ritmo_cardiaco || '--') + '<span class="vital-unit"> lpm</span>';
                document.getElementById('oxigeno').innerHTML = (u.oxigeno_sangre || '--') + '<span class="vital-unit">%</span>';
                document.getElementById('temperatura').innerHTML = (u.temperatura || '--') + '<span class="vital-unit">°C</span>';
            }
        } catch (e) {}
    }, 5000);
}

function cerrarSesion() {
    localStorage.removeItem('safewatch_token');
    localStorage.removeItem('safewatch_user');
    window.location.href = '../index.html';
}

cargarDashboard();
iniciarActualizacionTiempoReal();