/* ============================================================
   CONTROLLER-AUTH.JS — Autenticación, sesiones y permisos por rol
   Archivo: src/controllers/controller-auth.js
============================================================ */

// ---- USUARIOS DEL SISTEMA ----
const USUARIOS = {
  usuario: {
    password: 'user123',
    rol: 'usuario',
    nombre: 'Bryan Gomez',
    icon: '👤'
  },
  operador: {
    password: 'op2024',
    rol: 'operador',
    nombre: 'Carlos Mora',
    icon: '🛂'
  },
  admin: {
    password: 'admin2024',
    rol: 'administrador',
    nombre: 'Director ParkZone',
    icon: '👑'
  }
};

// Rol seleccionado en el login
let rolSeleccionado = 'usuario';

// Sesión actual
let sesionActual = null;

/* ---- Seleccionar rol en los botones ---- */
function seleccionarRol(rol) {
  rolSeleccionado = rol;
  document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-role="${rol}"]`).classList.add('active');
  document.getElementById('loginError').textContent = '';
}

/* ---- Mostrar/ocultar contraseña ---- */
function togglePass() {
  const input = document.getElementById('loginPass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ---- Iniciar sesión ---- */
function iniciarSesion() {
  const usuario = document.getElementById('loginUser').value.trim().toLowerCase();
  const password = document.getElementById('loginPass').value;

  if (!usuario || !password) {
    mostrarErrorLogin('⚠️ Por favor ingresa usuario y contraseña.');
    return;
  }

  const datos = USUARIOS[usuario];

  if (!datos) {
    mostrarErrorLogin('❌ Usuario no encontrado en el sistema.');
    return;
  }

  if (datos.rol !== rolSeleccionado) {
    mostrarErrorLogin(`❌ Este usuario no es un ${rolSeleccionado}. Selecciona el rol correcto.`);
    return;
  }

  if (datos.password !== password) {
    mostrarErrorLogin('❌ Contraseña incorrecta. Inténtalo de nuevo.');
    return;
  }

  sesionActual = {
    usuario: usuario,
    rol: datos.rol,
    nombre: datos.nombre,
    icon: datos.icon,
    horaIngreso: new Date()
  };

  const card = document.getElementById('loginCard');
  card.classList.add('login-exit');

  setTimeout(() => {
    document.getElementById('loginOverlay').style.display = 'none';
    iniciarSistema();
  }, 500);
}

/* ---- Mostrar error en login ---- */
function mostrarErrorLogin(txt) {
  const err = document.getElementById('loginError');
  err.textContent = txt;
  err.classList.add('shake');
  setTimeout(() => err.classList.remove('shake'), 500);
}

/* ---- Cerrar sesión ---- */
function cerrarSesion() {
  if (!confirm('¿Seguro que deseas cerrar sesión?')) return;
  sesionActual = null;
  document.getElementById('sistemaApp').style.display = 'none';
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginCard').classList.remove('login-exit');
  seleccionarRol('usuario');
}

/* ---- Mostrar/ocultar tarjetas exclusivas según el rol de la sesión ----
   Usuario       -> reservar, ver mi vehículo, ver mis reservas
   Operador      -> registrar entradas/salidas, reservas actuales, panel operador
   Administrador -> todo lo anterior + panel administrador (dashboard y nómina) */
function aplicarPermisosRol(rol) {
  const esUsuario = rol === 'usuario' || rol === 'administrador';
  const esOperador = rol === 'operador' || rol === 'administrador';
  const esAdmin = rol === 'administrador';

  const idsUsuario = ['cardReservaUsuario', 'cardMiVehiculo', 'cardMisReservas'];
  const idsOperador = ['cardRegistroVehiculos', 'cardVehiculosActivos', 'cardReservasActuales', 'panelOperador', 'cardHistorial'];
  const idsAdmin = ['panelAdmin'];

  idsUsuario.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = esUsuario ? 'block' : 'none';
  });
  idsOperador.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = esOperador ? 'block' : 'none';
  });
  idsAdmin.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = esAdmin ? 'block' : 'none';
  });
}

/* ---- Iniciar sistema después del login ---- */
function iniciarSistema() {
  document.getElementById('sistemaApp').style.display = 'block';

  document.getElementById('roleIcon').textContent = sesionActual.icon;
  document.getElementById('roleName').textContent =
    sesionActual.nombre + ' (' + capitalizar(sesionActual.rol) + ')';

  document.getElementById('footerSesion').textContent =
    capitalizar(sesionActual.rol) + ' — ' + sesionActual.nombre;

  aplicarPermisosRol(sesionActual.rol);

  initApp();
  renderMisReservas();
  renderReservasOperador();
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ---- Tecla Enter en el login ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') iniciarSesion();
  });
  document.getElementById('loginUser').addEventListener('keydown', e => {
    if (e.key === 'Enter') iniciarSesion();
  });
});
