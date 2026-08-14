/* ============================================================
   CONTROLLER-ADMIN.JS — Funciones exclusivas del Panel Administrador (Optimizado)
   Archivo: src/controllers/controller-admin.js
============================================================ */

/* ====================================================
   CONFIGURAR TARIFA
==================================================== */
function configurarTarifa() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;
  const tarifaShow = document.getElementById('tarifaActualShow');
  if (tarifaShow) tarifaShow.textContent = `${formatCOP(TARIFA_MIN)}/min`;
  const inputTarifa = document.getElementById('nuevaTarifa');
  if (inputTarifa) inputTarifa.value = TARIFA_MIN;
  const inputCobro = document.getElementById('nuevoCobMin');
  if (inputCobro) inputCobro.value = COBRO_MINIMO;
  const overlay = document.getElementById('overlayTarifa');
  if (overlay) overlay.classList.add('show');
}

function guardarTarifa() {
  const inputTarifa = document.getElementById('nuevaTarifa');
  const inputCobro = document.getElementById('nuevoCobMin');
  const nueva = inputTarifa ? parseInt(inputTarifa.value) : NaN;
  const nuevMin = inputCobro ? parseInt(inputCobro.value) : NaN;
  
  if (isNaN(nueva) || nueva < 10) {
    alert('Tarifa inválida. Mínimo $10/minuto.');
    return;
  }
  TARIFA_MIN   = nueva;
  COBRO_MINIMO = isNaN(nuevMin) ? nueva : nuevMin;
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
  
  const footerTarifa = document.getElementById('footerTarifa');
  if (footerTarifa) footerTarifa.textContent = nueva;
  
  const panelResult = document.getElementById('panelAdmResult');
  if (panelResult) {
    panelResult.innerHTML =
      `<div class="msg msg-ok msg-anim">✅ Tarifa actualizada a <b>${formatCOP(TARIFA_MIN)}/min</b>. Cobro mínimo: <b>${formatCOP(COBRO_MINIMO)}</b></div>`;
  }
  cerrarTarifa();
}

function cerrarTarifa() {
  const overlay = document.getElementById('overlayTarifa');
  if (overlay) overlay.classList.remove('show');
}

/* ====================================================
   INFORME / RESET / EXPORTAR
==================================================== */
function verInformeCompleto() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  const ocup = typeof ocupados !== 'undefined' ? ocupados.size : 0;
  const pct  = Math.round((ocup / maxCap) * 100);
  const panelResult = document.getElementById('panelAdmResult');
  if (panelResult) {
    panelResult.innerHTML = `
      <div class="msg msg-info msg-anim">
        📊 <b>Informe Completo del Sistema</b><br>
        Capacidad total: <b>${maxCap} puestos</b><br>
        Ocupación actual: <b>${ocup} (${pct}%)</b><br>
        Ingresos totales hoy: <b>${formatCOP(typeof ingresos !== 'undefined' ? ingresos : 0)}</b><br>
        Vehículos atendidos: <b>${typeof totalHoy !== 'undefined' ? totalHoy : 0}</b><br>
        Tarifa vigente: <b>${formatCOP(typeof TARIFA_MIN !== 'undefined' ? TARIFA_MIN : 100)}/min</b><br>
        Reservas totales: <b>${typeof reservas !== 'undefined' ? reservas.length : 0}</b><br>
        Movimientos registrados: <b>${typeof historial !== 'undefined' ? historial.length : 0}</b>
      </div>`;
  }
}

function resetearSistema() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;
  if (!confirm('⚠️ ¿Seguro que deseas resetear el sistema?\nSe borrará todo el registro del día, incluyendo reservas y turnos.')) return;

  vehiculos = {};
  ocupados  = new Set();
  historial = [];
  ingresos  = 0;
  totalHoy  = 0;
  reservas  = [];
  contadorReservaId = 1;
  turnos = [];
  turnoActivo = false;
  horaInicioTurno = null;
  operadorTurnoActual = null;

  try { if (typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  if (typeof initMapa === 'function') initMapa();
  if (typeof actualizarStats === 'function') actualizarStats();
  if (typeof actualizarListaActivos === 'function') actualizarListaActivos();
  if (typeof renderMisReservas === 'function') renderMisReservas();
  if (typeof renderReservasOperador === 'function') renderReservasOperador();
  
  const histEl = document.getElementById('historial');
  if (histEl) histEl.innerHTML = '<div class="hist-empty">Sin movimientos registrados aún</div>';
  
  const panelResult = document.getElementById('panelAdmResult');
  if (panelResult) {
    panelResult.innerHTML =
      `<div class="msg msg-warn msg-anim">🔄 Sistema reseteado correctamente a las ${new Date().toLocaleTimeString('es-CO')}.</div>`;
  }
}

function exportarDatos() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;
  const data = {
    fecha: new Date().toLocaleDateString('es-CO'),
    ingresos: typeof ingresos !== 'undefined' ? ingresos : 0,
    totalHoy: typeof totalHoy !== 'undefined' ? totalHoy : 0,
    vehiculosActivos: typeof vehiculos !== 'undefined' ? Object.keys(vehiculos).length : 0,
    historial: typeof historial !== 'undefined' ? historial.slice(0, 50) : [],
    reservas: typeof reservas !== 'undefined' ? reservas.slice(0, 100) : [],
    turnos: typeof turnos !== 'undefined' ? turnos : []
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `parkzone_reporte_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);

  const panelResult = document.getElementById('panelAdmResult');
  if (panelResult) {
    panelResult.innerHTML =
      `<div class="msg msg-ok msg-anim">📤 Datos exportados correctamente.</div>`;
  }
}

/* ====================================================
   DASHBOARD — Vista general del sistema
==================================================== */
function abrirDashboard() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;

  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  const ocup = typeof ocupados !== 'undefined' ? ocupados.size : 0;
  const lib  = maxCap - ocup;
  const listRes = typeof reservas !== 'undefined' ? reservas : [];
  const pendientes  = listRes.filter(r => r.estado === 'pendiente').length;
  const confirmadas = listRes.filter(r => r.estado === 'confirmada').length;
  const activas     = listRes.filter(r => r.estado === 'activa').length;
  const finalizadas = listRes.filter(r => r.estado === 'finalizada').length;
  const canceladas  = listRes.filter(r => r.estado === 'cancelada').length;
  
  const listTurnos = typeof turnos !== 'undefined' ? turnos : [];
  const operadoresHoy = new Set(listTurnos.map(t => t.operador));
  if (typeof turnoActivo !== 'undefined' && turnoActivo && operadorTurnoActual) {
    operadoresHoy.add(operadorTurnoActual.usuario);
  }

  const dashBody = document.getElementById('dashboardBody');
  if (dashBody) {
    dashBody.innerHTML = `
      <div class="stats-bar" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat stat-ocupados"><div class="stat-icon">🔴</div><div><div class="stat-num">${ocup}</div><div class="stat-lbl">Ocupados</div></div></div>
        <div class="stat stat-libres"><div class="stat-icon">🟢</div><div><div class="stat-num">${lib}</div><div class="stat-lbl">Disponibles</div></div></div>
        <div class="stat stat-ingresos"><div class="stat-icon">💰</div><div><div class="stat-num">${formatCOP(typeof ingresos !== 'undefined' ? ingresos : 0)}</div><div class="stat-lbl">Ingresos Hoy</div></div></div>
        <div class="stat stat-total"><div class="stat-icon">📋</div><div><div class="stat-num">${typeof totalHoy !== 'undefined' ? totalHoy : 0}</div><div class="stat-lbl">Atendidos Hoy</div></div></div>
      </div>
      <div class="hist-list" style="margin-top:1.2rem;max-height:none">
        <div class="modal-row"><span class="modal-key">📥 Reservas pendientes</span><span class="modal-val">${pendientes}</span></div>
        <div class="modal-row"><span class="modal-key">📌 Reservas confirmadas</span><span class="modal-val">${confirmadas}</span></div>
        <div class="modal-row"><span class="modal-key">🚗 Reservas activas (dentro)</span><span class="modal-val">${activas}</span></div>
        <div class="modal-row"><span class="modal-key">🏁 Reservas finalizadas</span><span class="modal-val">${finalizadas}</span></div>
        <div class="modal-row"><span class="modal-key">🚫 Reservas canceladas</span><span class="modal-val">${canceladas}</span></div>
        <div class="modal-row"><span class="modal-key">🛂 Operadores con actividad hoy</span><span class="modal-val">${operadoresHoy.size}</span></div>
        <div class="modal-row"><span class="modal-key">⏱ Turno activo ahora</span><span class="modal-val">${turnoActivo && operadorTurnoActual ? operadorTurnoActual.nombre : 'Ninguno'}</span></div>
      </div>
    `;
  }
  const overlay = document.getElementById('overlayDashboard');
  if (overlay) overlay.classList.add('show');
}

function cerrarDashboard() {
  const overlay = document.getElementById('overlayDashboard');
  if (overlay) overlay.classList.remove('show');
}

/* ====================================================
   NÓMINA — Cálculo de pago según horas laborales del operador
==================================================== */
function abrirNomina() {
  if (!sesionActual || sesionActual.rol !== 'administrador') return;
  const inputTarifa = document.getElementById('nominaTarifaInput');
  if (inputTarifa) inputTarifa.value = TARIFA_HORA_OPERADOR;
  calcularYRenderNomina();
  const overlay = document.getElementById('overlayNomina');
  if (overlay) overlay.classList.add('show');
}

function cerrarNomina() {
  const overlay = document.getElementById('overlayNomina');
  if (overlay) overlay.classList.remove('show');
}

function calcularYRenderNomina() {
  const inputTarifa = document.getElementById('nominaTarifaInput');
  const tarifaInput = inputTarifa ? parseInt(inputTarifa.value) : NaN;
  if (!isNaN(tarifaInput) && tarifaInput > 0) TARIFA_HORA_OPERADOR = tarifaInput;

  const filas = typeof calcularNomina === 'function' ? calcularNomina(TARIFA_HORA_OPERADOR) : [];
  const cont = document.getElementById('nominaBody');
  const totalGenEl = document.getElementById('nominaTotalGeneral');

  if (filas.length === 0) {
    if (cont) cont.innerHTML = '<div class="hist-empty">Aún no hay turnos registrados para calcular la nómina.</div>';
    if (totalGenEl) totalGenEl.textContent = formatCOP(0);
    return;
  }

  if (cont) cont.innerHTML = '';
  let totalGeneral = 0;
  filas.forEach(f => {
    totalGeneral += f.pago;
    if (cont) {
      const d = document.createElement('div');
      d.className = 'hist-item hist-item-anim';
      d.style.flexDirection = 'column';
      d.style.alignItems = 'stretch';
      d.style.gap = '0.3rem';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="hist-placa">👤 ${f.nombre}</span>
          ${f.enCurso ? '<span class="badge badge-e">Turno en curso</span>' : ''}
        </div>
        <div class="modal-row"><span class="modal-key">⏱ Horas trabajadas</span><span class="modal-val">${f.horas.toFixed(2)} h</span></div>
        <div class="modal-row"><span class="modal-key">💲 Tarifa por hora</span><span class="modal-val">${formatCOP(TARIFA_HORA_OPERADOR)}</span></div>
        <div class="modal-total"><span>💰 Pago a recibir</span><span>${formatCOP(f.pago)}</span></div>
      `;
      cont.appendChild(d);
    }
  });

  if (totalGenEl) totalGenEl.textContent = formatCOP(totalGeneral);
}

// Cerrar modales al hacer clic fuera de ellos
const ovTarifa = document.getElementById('overlayTarifa');
if (ovTarifa) {
  ovTarifa.addEventListener('click', e => {
    if (e.target === ovTarifa) cerrarTarifa();
  });
}
const ovDash = document.getElementById('overlayDashboard');
if (ovDash) {
  ovDash.addEventListener('click', e => {
    if (e.target === ovDash) cerrarDashboard();
  });
}
const ovNomina = document.getElementById('overlayNomina');
if (ovNomina) {
  ovNomina.addEventListener('click', e => {
    if (e.target === ovNomina) cerrarNomina();
  });
}
