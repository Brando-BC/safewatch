const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('safewatch_token');

if (!token) window.location.href = '../index.html';

let pacientes = [];
let editandoId = null;

async function cargarPacientes() {
    try {
        const res = await fetch(`${API_URL}/pacientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        pacientes = await res.json();
        renderTabla();
    } catch (e) {
        console.error('Error cargando:', e);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaPacientes');
    if (pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pacientes</td></tr>';
        return;
    }
    tbody.innerHTML = pacientes.map(p => `
        <tr>
            <td>${p.dni}</td>
            <td>${p.nombre_completo}</td>
            <td>${p.edad || '--'}</td>
            <td>${p.tipo_sangre || '--'}</td>
            <td>${p.medicacion_actual || '--'}</td>
            <td>
                <button class="btn-editar" onclick="editarPaciente('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-eliminar" onclick="eliminarPaciente('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function abrirFormulario() {
    editandoId = null;
    document.getElementById('tituloFormulario').textContent = 'Nuevo Paciente';
    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
    document.getElementById('formPassword').placeholder = 'Contraseña para el paciente';
    document.getElementById('formPassword').required = true;
    document.getElementById('modalPaciente').style.display = 'block';
}

function cerrarFormulario() {
    document.getElementById('modalPaciente').style.display = 'none';
}

function editarPaciente(id) {
    const p = pacientes.find(p => p.id === id);
    if (!p) return;
    
    editandoId = id;
    document.getElementById('tituloFormulario').textContent = 'Editar Paciente';
    document.getElementById('pacienteId').value = p.id;
    document.getElementById('formDni').value = p.dni;
    document.getElementById('formPassword').value = '';
    document.getElementById('formPassword').placeholder = 'Dejar vacío para no cambiar';
    document.getElementById('formPassword').required = false;
    document.getElementById('formNombre').value = p.nombre_completo;
    document.getElementById('formFechaNac').value = p.fecha_nacimiento || '';
    document.getElementById('formSangre').value = p.tipo_sangre || '';
    document.getElementById('formPeso').value = p.peso || '';
    document.getElementById('formAltura').value = p.altura || '';
    document.getElementById('formAlergias').value = p.alergias || '';
    document.getElementById('formMedicacion').value = p.medicacion_actual || '';
    document.getElementById('formDiagnosticos').value = p.diagnosticos?.join(', ') || '';
    document.getElementById('modalPaciente').style.display = 'block';
}

async function guardarPaciente(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const body = {
        dni: document.getElementById('formDni').value,
        password: document.getElementById('formPassword').value,
        nombre_completo: document.getElementById('formNombre').value,
        fecha_nacimiento: document.getElementById('formFechaNac').value || null,
        tipo_sangre: document.getElementById('formSangre').value,
        peso: document.getElementById('formPeso').value,
        altura: document.getElementById('formAltura').value,
        alergias: document.getElementById('formAlergias').value,
        medicacion_actual: document.getElementById('formMedicacion').value,
        diagnosticos: document.getElementById('formDiagnosticos').value
    };

    try {
        const url = editandoId 
            ? `${API_URL}/pacientes/${editandoId}`
            : `${API_URL}/pacientes`;
        
        const method = editandoId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success || data.id) {
            mostrarMensaje('✅ Paciente guardado correctamente', 'exito');
            cerrarFormulario();
            cargarPacientes();
        } else {
            mostrarMensaje('❌ ' + (data.error || 'Error al guardar'), 'error');
        }
    } catch (e) {
        mostrarMensaje('❌ Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Paciente';
    }
}

async function eliminarPaciente(id) {
    const p = pacientes.find(p => p.id === id);
    if (!confirm(`¿Eliminar a ${p.nombre_completo}?`)) return;

    try {
        await fetch(`${API_URL}/pacientes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        mostrarMensaje('✅ Paciente eliminado', 'exito');
        cargarPacientes();
    } catch (e) {
        mostrarMensaje('❌ Error al eliminar', 'error');
    }
}

function mostrarMensaje(texto, tipo) {
    const msg = document.getElementById('mensaje');
    msg.textContent = texto;
    msg.className = 'mensaje mensaje-' + tipo;
    setTimeout(() => { msg.className = 'mensaje'; }, 3000);
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = '../index.html';
}

cargarPacientes();