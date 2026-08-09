const API_URL = 'http://localhost:3000/api';

function mostrarLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function cerrarLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

async function iniciarSesion(event) {
    event.preventDefault();
    
    const dni = document.getElementById('dni').value;
    const password = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;
    const btn = document.getElementById('btnSubmit');
    const mensaje = document.getElementById('loginMensaje');
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    btn.disabled = true;
    mensaje.textContent = '';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni, password, rol })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mensaje.style.color = '#34a853';
            mensaje.textContent = '¡Inicio exitoso! Redirigiendo...';
            
            localStorage.setItem('safewatch_token', data.token);
            localStorage.setItem('safewatch_user', JSON.stringify(data.usuario));
            
            setTimeout(() => {
                if (rol === 'paciente') {
                    window.location.href = 'pages/paciente.html';
                } else {
                    window.location.href = 'pages/admin.html';
                }
            }, 1000);
        } else {
            mensaje.textContent = data.message || 'Error al iniciar sesión';
        }
    } catch (error) {
        mensaje.textContent = 'Error de conexión con el servidor';
        console.error(error);
    } finally {
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        btn.disabled = false;
    }
}