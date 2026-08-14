/* ============================================================
   CONTROLLER-AUTH.JS — Autenticación, OAuth Social Login y Auto-Detección de Rol
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
    icon: '`🛂`'
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

/* ---- Auto-detección inteligente del rol al escribir ---- */
function detectarRolAuto(val) {
  if (!val) return;
  const v = val.trim().toLowerCase();
  
  if (v.includes('admin') || v.includes('director') || v.includes('@parkzone.admin.com')) {
    seleccionarRol('administrador');
  } else if (v.includes('operador') || v.includes('carlos') || v.includes('op2024') || v.includes('@parkzone.op.com')) {
    seleccionarRol('operador');
  } else if (v.includes('user') || v.includes('usuario') || v.includes('bryan')) {
    seleccionarRol('usuario');
  }
}

/* ---- Seleccionar rol en los botones ---- */
function seleccionarRol(rol) {
  rolSeleccionado = rol;
  document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
  const btnRol = document.querySelector(`[data-role="${rol}"]`);
  if (btnRol) btnRol.classList.add('active');
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.textContent = '';
}

/* ---- Mostrar/ocultar contraseña ---- */
function togglePass() {
  const input = document.getElementById('loginPass');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

/* ---- Iniciar sesión tradicional ---- */
function iniciarSesion() {
  const inputUser = document.getElementById('loginUser');
  const inputPass = document.getElementById('loginPass');
  const usuario = inputUser ? inputUser.value.trim().toLowerCase() : '';
  const password = inputPass ? inputPass.value : '';

  if (!usuario || !password) {
    mostrarErrorLogin('⚠️ Por favor ingresa usuario y contraseña.');
    return;
  }

  // Intentar coincidencia directa o auto-detectar por credencial
  let datos = USUARIOS[usuario];

  if (!datos) {
    // Si ingresó un email personalizado, auto-evaluar rol
    const rolAuto = determinarRolPorEmail(usuario);
    datos = {
      password: password,
      rol: rolAuto,
      nombre: usuario.split('@')[0],
      icon: rolAuto === 'administrador' ? '👑' : (rolAuto === 'operador' ? '🛂' : '👤')
    };
  }

  if (datos.password && datos.password !== password && USUARIOS[usuario]) {
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
  if (card) card.classList.add('login-exit');

  setTimeout(() => {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
    iniciarSistema();
  }, 500);
}

/* ---- Determinar Rol Automáticamente por Email / Cuenta ---- */
function determinarRolPorEmail(email) {
  const e = String(email).toLowerCase();
  if (e.includes('admin') || e.includes('director') || e.includes('parkzone.admin')) {
    return 'administrador';
  }
  if (e.includes('operador') || e.includes('carlos') || e.includes('op') || e.includes('parkzone.op')) {
    return 'operador';
  }
  return 'usuario';
}

/* ---- Login con Redes Sociales (Google, GitHub, Microsoft) ---- */
function loginConSocial(provider) {
  const titulos = {
    google: { title: 'Iniciar sesión con Google', icon: '🌐', bg: '#4285F4' },
    github: { title: 'Iniciar sesión con GitHub', icon: '🐙', bg: '#24292e' },
    microsoft: { title: 'Iniciar sesión con Microsoft', icon: '🪟', bg: '#05a6f0' }
  };

  const info = titulos[provider] || titulos.google;
  
  const modalTitle = document.getElementById('socialModalTitle');
  if (modalTitle) modalTitle.textContent = info.title;
  
  const modalIcon = document.getElementById('socialModalIcon');
  if (modalIcon) modalIcon.textContent = info.icon;

  // Cuentas con auto-detección automática de rol (Admin, Operador, Usuario)
  const cuentasSugeridas = [
    { email: `admin.${provider}@parkzone.admin.com`, nombre: 'Director Sistema (Admin)', rol: 'administrador', icon: '👑' },
    { email: `operador.${provider}@parkzone.op.com`, nombre: 'Carlos Mora (Operador)', rol: 'operador', icon: '🛂' },
    { email: `usuario.demo@${provider}.com`, nombre: 'Bryan Gomez (Usuario)', rol: 'usuario', icon: '👤' }
  ];

  const bodyEl = document.getElementById('socialModalBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="font-size:0.85rem;color:var(--texto-medio);margin-bottom:0.8rem">
        Selecciona la cuenta vinculada a tu proveedor <b>${provider.toUpperCase()}</b>. El sistema identificará tu rol automáticamente:
      </div>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        ${cuentasSugeridas.map(c => `
          <div class="account-option" onclick="seleccionarCuentaSocial('${c.email}', '${c.nombre}', '${c.rol}', '${c.icon}')">
            <div>
              <div style="font-weight:700;color:#fff">${c.icon} ${c.nombre}</div>
              <div style="font-size:0.78rem;color:var(--texto-cyan);font-family:var(--font-mono)">${c.email}</div>
            </div>
            <span class="badge ${c.rol === 'administrador' ? 'badge-s' : (c.rol === 'operador' ? 'badge-e' : '')}">${c.rol.toUpperCase()}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  const overlaySocial = document.getElementById('overlaySocialLogin');
  if (overlaySocial) overlaySocial.classList.add('show');
}

function seleccionarCuentaSocial(email, nombre, rol, icon) {
  sesionActual = {
    usuario: email,
    rol: rol,
    nombre: nombre,
    icon: icon,
    horaIngreso: new Date()
  };

  cerrarSocialLogin();

  const card = document.getElementById('loginCard');
  if (card) card.classList.add('login-exit');

  setTimeout(() => {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
    iniciarSistema();
  }, 500);
}

function cerrarSocialLogin() {
  const overlaySocial = document.getElementById('overlaySocialLogin');
  if (overlaySocial) overlaySocial.classList.remove('show');
}

/* ---- Mostrar error en login ---- */
function mostrarErrorLogin(txt) {
  const err = document.getElementById('loginError');
  if (!err) return;
  err.textContent = txt;
  err.classList.add('shake');
  setTimeout(() => err.classList.remove('shake'), 500);
}

/* ---- Cerrar sesión ---- */
function cerrarSesion() {
  if (!confirm('¿Seguro que deseas cerrar sesión?')) return;
  sesionActual = null;
  const sysApp = document.getElementById('sistemaApp');
  if (sysApp) sysApp.style.display = 'none';
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
  const inputUser = document.getElementById('loginUser');
  if (inputUser) inputUser.value = '';
  const inputPass = document.getElementById('loginPass');
  if (inputPass) inputPass.value = '';
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.textContent = '';
  const card = document.getElementById('loginCard');
  if (card) card.classList.remove('login-exit');
  seleccionarRol('usuario');
}

/* ---- Mostrar/ocultar tarjetas exclusivas según el rol de la sesión ---- */
function aplicarPermisosRol(rol) {
  const esUsuarioOnly = rol === 'usuario';
  const esOperador = rol === 'operador' || rol === 'administrador';
  const esAdmin = rol === 'administrador';

  const idsUsuario = ['cardReservaUsuario', 'cardMiVehiculo', 'cardMisReservas'];
  const idsOperador = ['cardRegistroVehiculos', 'cardVehiculosActivos', 'cardReservasActuales', 'panelOperador', 'cardHistorial'];
  const idsAdmin = ['panelAdmin'];

  // El usuario estándar solo ve reservas y consulta de su vehículo
  idsUsuario.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (esUsuarioOnly || esAdmin) ? 'block' : 'none';
  });
  // El operador y admin ven registro de entradas/salidas, lista de activos y panel operativo
  idsOperador.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = esOperador ? 'block' : 'none';
  });
  // Solo el administrador ve el panel de administración, tarifas y nómina
  idsAdmin.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = esAdmin ? 'block' : 'none';
  });
}

/* ---- Iniciar sistema después del login ---- */
function iniciarSistema() {
  const sysApp = document.getElementById('sistemaApp');
  if (sysApp) sysApp.style.display = 'block';

  const roleIcon = document.getElementById('roleIcon');
  if (roleIcon) roleIcon.textContent = sesionActual.icon;

  const roleName = document.getElementById('roleName');
  if (roleName) {
    roleName.textContent = sesionActual.nombre + ' (' + capitalizar(sesionActual.rol) + ')';
  }

  const footerSesion = document.getElementById('footerSesion');
  if (footerSesion) {
    footerSesion.textContent = capitalizar(sesionActual.rol) + ' — ' + sesionActual.nombre;
  }

  aplicarPermisosRol(sesionActual.rol);

  if (typeof initApp === 'function') initApp();
  if (typeof renderMisReservas === 'function') renderMisReservas();
  if (typeof renderReservasOperador === 'function') renderReservasOperador();
}

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ---- Tecla Enter en el login ---- */
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('loginPass');
  if (passInput) {
    passInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') iniciarSesion();
    });
  }
  const userInput = document.getElementById('loginUser');
  if (userInput) {
    userInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') iniciarSesion();
    });
  }
});

/* ============================================================
   CONTROLADOR DE PERFIL DE USUARIO Y GARAJE DE FAVORITOS
============================================================ */
let avatarSeleccionadoTemp = null;

function abrirModalPerfil() {
  if (!sesionActual) return;

  const uKey = sesionActual.usuario;
  if (!perfilDatos[uKey]) {
    perfilDatos[uKey] = {
      nombre: sesionActual.nombre,
      email: uKey + '@parkzone.com',
      telefono: '300 000 0000',
      icon: sesionActual.icon,
      garaje: []
    };
  }

  const data = perfilDatos[uKey];
  avatarSeleccionadoTemp = data.icon || sesionActual.icon;

  const elNombre = document.getElementById('perfilNombre');
  const elEmail  = document.getElementById('perfilEmail');
  const elTel    = document.getElementById('perfilTelefono');
  const elPass   = document.getElementById('perfilPass');

  if (elNombre) elNombre.value = data.nombre || sesionActual.nombre;
  if (elEmail)  elEmail.value  = data.email  || (uKey + '@parkzone.com');
  if (elTel)    elTel.value    = data.telefono || '300 000 0000';
  if (elPass)   elPass.value   = '';

  const titleEl = document.getElementById('perfilTitle');
  const subEl   = document.getElementById('perfilSub');
  const iconEl  = document.getElementById('perfilHeaderIcon');

  if (titleEl) titleEl.textContent = `PERFIL DE ${data.nombre.toUpperCase()}`;
  if (subEl)   subEl.textContent   = `Rol: ${capitalizar(sesionActual.rol)} — Edita tus datos, favoritos y estadísticas`;
  if (iconEl)  iconEl.textContent  = avatarSeleccionadoTemp;

  actualizarAvatarUI(avatarSeleccionadoTemp);
  switchTabPerfil('datos');
  renderListaGaraje();
  renderEstadisticasPerfil();

  const overlay = document.getElementById('overlayPerfil');
  if (overlay) overlay.classList.add('show');
}

function cerrarModalPerfil() {
  const overlay = document.getElementById('overlayPerfil');
  if (overlay) overlay.classList.remove('show');
}

function switchTabPerfil(tabName) {
  ['datos', 'garaje', 'stats'].forEach(t => {
    const sec = document.getElementById('secPerfil' + capitalizar(t));
    const btn = document.getElementById('tabBtn' + capitalizar(t));
    if (sec) sec.style.display = t === tabName ? 'flex' : 'none';
    if (btn) {
      if (t === tabName) {
        btn.style.background = '#ecfdf5';
        btn.style.color = '#065f46';
        btn.style.border = '2px solid #059669';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = '#f8fafc';
        btn.style.color = '#334155';
        btn.style.border = '1px solid #cbd5e1';
        btn.style.fontWeight = '600';
      }
    }
  });
}

function seleccionarAvatar(icon) {
  avatarSeleccionadoTemp = icon;
  actualizarAvatarUI(icon);
}

function actualizarAvatarUI(icon) {
  document.querySelectorAll('.avatar-opt').forEach(btn => {
    if (btn.textContent.trim() === icon) {
      btn.style.border = '2px solid #059669';
      btn.style.background = '#ecfdf5';
    } else {
      btn.style.border = '1px solid #cbd5e1';
      btn.style.background = '#ffffff';
    }
  });
  const iconEl = document.getElementById('perfilHeaderIcon');
  if (iconEl) iconEl.textContent = icon;
}

function guardarPerfilUsuario() {
  if (!sesionActual) return;
  const uKey = sesionActual.usuario;

  const nombre = document.getElementById('perfilNombre').value.trim();
  const email  = document.getElementById('perfilEmail').value.trim();
  const tel    = document.getElementById('perfilTelefono').value.trim();
  const pass   = document.getElementById('perfilPass').value;

  if (!nombre) {
    alert('Por favor ingresa tu nombre completo.');
    return;
  }

  if (!perfilDatos[uKey]) perfilDatos[uKey] = { garaje: [] };
  perfilDatos[uKey].nombre   = nombre;
  perfilDatos[uKey].email    = email;
  perfilDatos[uKey].telefono = tel;
  perfilDatos[uKey].icon     = avatarSeleccionadoTemp || sesionActual.icon;

  if (pass) {
    if (USUARIOS[uKey]) USUARIOS[uKey].password = pass;
  }

  sesionActual.nombre = nombre;
  sesionActual.icon   = avatarSeleccionadoTemp;

  // Actualizar UI del Header
  const roleIcon = document.getElementById('roleIcon');
  const roleName = document.getElementById('roleName');
  if (roleIcon) roleIcon.textContent = sesionActual.icon;
  if (roleName) roleName.textContent = sesionActual.nombre + ' (' + capitalizar(sesionActual.rol) + ')';

  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
  alert('✅ ¡Perfil de usuario actualizado con éxito!');
  cerrarModalPerfil();
}

/* ---- MI GARAJE DE VEHÍCULOS FAVORITOS ---- */
function agregarVehiculoFavorito() {
  if (!sesionActual) return;
  const uKey = sesionActual.usuario;

  const placa  = document.getElementById('favPlaca').value.trim().toUpperCase();
  const marca  = document.getElementById('favMarca').value.trim();
  const modelo = document.getElementById('favModelo').value.trim();
  const color  = document.getElementById('favColor').value.trim();

  if (!placa || placa.length < 5) {
    alert('Ingresa una placa válida para tu vehículo favorito.');
    return;
  }

  if (!perfilDatos[uKey]) perfilDatos[uKey] = { garaje: [] };
  if (!Array.isArray(perfilDatos[uKey].garaje)) perfilDatos[uKey].garaje = [];

  // Evitar duplicados
  if (perfilDatos[uKey].garaje.some(v => v.placa === placa)) {
    alert(`El vehículo con placa ${placa} ya está registrado en tu garaje.`);
    return;
  }

  perfilDatos[uKey].garaje.push({ placa, marca: marca || 'Genérico', modelo: modelo || 'Estándar', color: color || 'Gris' });
  
  document.getElementById('favPlaca').value  = '';
  document.getElementById('favMarca').value  = '';
  document.getElementById('favModelo').value = '';
  document.getElementById('favColor').value  = '';

  renderListaGaraje();
  renderBarraAccesoRapidoGaraje();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
  alert(`🚗 Vehículo ${placa} agregado a tu garaje favorito.`);
}

function eliminarVehiculoFavorito(idx) {
  if (!sesionActual) return;
  const uKey = sesionActual.usuario;
  if (!perfilDatos[uKey] || !perfilDatos[uKey].garaje) return;

  perfilDatos[uKey].garaje.splice(idx, 1);
  renderListaGaraje();
  renderBarraAccesoRapidoGaraje();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
}

function renderListaGaraje() {
  const cont = document.getElementById('listaGaraje');
  if (!cont || !sesionActual) return;

  const garaje = (perfilDatos[sesionActual.usuario] && perfilDatos[sesionActual.usuario].garaje) || [];

  if (garaje.length === 0) {
    cont.innerHTML = '<div class="hist-empty">🚗 Aún no tienes vehículos guardados en tu garaje</div>';
    return;
  }

  cont.innerHTML = '';
  garaje.forEach((v, idx) => {
    const d = document.createElement('div');
    d.className = 'hist-item';
    d.style.display = 'flex';
    d.style.justifyContent = 'space-between';
    d.style.alignItems = 'center';
    d.style.padding = '0.6rem 0.8rem';
    d.style.margin = '0.3rem 0';
    d.style.borderRadius = '8px';
    d.style.background = '#ffffff';
    d.style.border = '1px solid #e2e8f0';

    d.innerHTML = `
      <div>
        <span style="font-weight:800;font-family:var(--font-mono);color:#0f172a">🚗 ${v.placa}</span>
        <span style="font-size:0.82rem;color:#475569;margin-left:0.5rem">${v.marca} ${v.modelo} (${v.color})</span>
      </div>
      <div style="display:flex;gap:0.4rem">
        <button class="btn btn-entrada" style="padding:0.25rem 0.5rem;font-size:0.75rem" onclick="cargarVehiculoFavoritoEnReserva(${idx})">📋 Usar</button>
        <button class="btn btn-salida" style="padding:0.25rem 0.5rem;font-size:0.75rem" onclick="eliminarVehiculoFavorito(${idx})">🗑️</button>
      </div>
    `;
    cont.appendChild(d);
  });
}

function cargarVehiculoFavoritoEnReserva(idx) {
  if (!sesionActual) return;
  const garaje = (perfilDatos[sesionActual.usuario] && perfilDatos[sesionActual.usuario].garaje) || [];
  const v = garaje[idx];
  if (!v) return;

  const elP = document.getElementById('resPlaca');
  const elM = document.getElementById('resMarca');
  const elMod = document.getElementById('resModelo');
  const elC = document.getElementById('resColor');

  if (elP) elP.value = v.placa;
  if (elM) elM.value = v.marca;
  if (elMod) elMod.value = v.modelo;
  if (elC) elC.value = v.color;

  cerrarModalPerfil();
  alert(`✅ Datos del vehículo ${v.placa} cargados en el formulario de reserva.`);
}

function renderBarraAccesoRapidoGaraje() {
  const cont = document.getElementById('accesoRapidoGarajeBox');
  if (!cont || !sesionActual) return;

  const garaje = (perfilDatos[sesionActual.usuario] && perfilDatos[sesionActual.usuario].garaje) || [];
  if (garaje.length === 0) {
    cont.innerHTML = '';
    return;
  }

  cont.innerHTML = `
    <div style="font-size:0.78rem;font-weight:700;color:#475569;margin-bottom:0.3rem">⚡ Auto-completar desde Mi Garaje:</div>
    <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
      ${garaje.map((v, i) => `
        <button type="button" class="btn btn-op" style="padding:0.3rem 0.55rem;font-size:0.75rem" onclick="cargarVehiculoFavoritoEnReserva(${i})">
          🚗 ${v.placa} (${v.marca})
        </button>
      `).join('')}
    </div>
  `;
}

/* ---- ESTADÍSTICAS DEL PERFIL ---- */
function renderEstadisticasPerfil() {
  const cont = document.getElementById('perfilStatsBody');
  if (!cont || !sesionActual) return;

  const uKey = sesionActual.usuario;
  const misRes = typeof reservas !== 'undefined' ? reservas.filter(r => r.usuario === uKey) : [];
  const resActivas = misRes.filter(r => ['pendiente', 'confirmada', 'activa'].includes(r.estado));
  const resFinales = misRes.filter(r => r.estado === 'finalizada');
  const gastoTotal = resFinales.reduce((sum, r) => sum + (r.costoFinal || 0), 0);

  cont.innerHTML = `
    <div class="modal-row"><span class="modal-key">📊 Reservas Creadas Totales</span><span class="modal-val">${misRes.length} reservas</span></div>
    <div class="modal-row"><span class="modal-key">🟢 Reservas Activas / Pendientes</span><span class="modal-val">${resActivas.length} activas</span></div>
    <div class="modal-row"><span class="modal-key">🏁 Reservas Finalizadas Con Éxito</span><span class="modal-val">${resFinales.length} completadas</span></div>
    <div class="modal-total" style="margin-top:0.8rem">
      <span>💰 GASTO TOTAL EN PARQUEADERO</span>
      <span>${typeof formatCOP === 'function' ? formatCOP(gastoTotal) : '$' + gastoTotal}</span>
    </div>
  `;
}
