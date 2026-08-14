/* ============================================================
   CONTROLLER-OPERADOR.JS — Funciones exclusivas del Panel Operador
   Archivo: src/controllers/controller-operador.js
============================================================ */

/* ---- Abrir turno (registra hora de inicio para el cálculo de nómina) ---- */
function abrirTurno() {
  if (!['operador', 'administrador'].includes(sesionActual.rol)) return;

  if (turnoActivo) {
    const dur = formatDur(new Date() - horaInicioTurno);
    document.getElementById('panelOpResult').innerHTML =
      `<div class="msg msg-warn">⚠️ Ya hay un turno activo (<b>${operadorTurnoActual.nombre}</b>). Lleva <b>${dur}</b> abierto.</div>`;
    return;
  }

  registrarAperturaTurno(sesionActual.usuario, sesionActual.nombre);
  document.getElementById('panelOpResult').innerHTML =
    `<div class="msg msg-ok">✅ Turno abierto a las <b>${horaInicioTurno.toLocaleTimeString('es-CO')}</b>.<br>
     Operador: <b>${sesionActual.nombre}</b></div>`;
}

/* ---- Cerrar turno (guarda las horas trabajadas para la nómina) ---- */
function cerrarTurno() {
  if (!['operador', 'administrador'].includes(sesionActual.rol)) return;

  if (!turnoActivo) {
    document.getElementById('panelOpResult').innerHTML =
      `<div class="msg msg-warn">⚠️ No hay ningún turno activo para cerrar.</div>`;
    return;
  }

  const registro = registrarCierreTurno();
  document.getElementById('panelOpResult').innerHTML = `
    <div class="msg msg-ok">
      🔒 <b>Turno cerrado</b><br>
      Operador: <b>${registro.nombre}</b><br>
      Duración: <b>${formatDur(registro.horas * 3600000)}</b> (${registro.horas.toFixed(2)} h)
    </div>`;
}

/* ---- Reporte rápido del turno actual ---- */
function reporteRapido() {
  if (!['operador', 'administrador'].includes(sesionActual.rol)) return;
  const dur = turnoActivo ? formatDur(new Date() - horaInicioTurno) : 'Sin turno activo';
  document.getElementById('panelOpResult').innerHTML = `
    <div class="msg msg-info">
      📋 <b>Reporte rápido — Turno actual</b><br>
      Duración turno: <b>${dur}</b><br>
      Vehículos dentro: <b>${ocupados.size}</b><br>
      Reservas pendientes: <b>${reservas.filter(r => r.estado === 'pendiente').length}</b><br>
      Atendidos hoy: <b>${totalHoy}</b><br>
      Ingresos hoy: <b>${formatCOP(ingresos)}</b>
    </div>`;
}

/* ---- Buscar vehículo activo por placa ---- */
function buscarVehiculo() {
  if (!['operador', 'administrador'].includes(sesionActual.rol)) return;
  const placa = prompt('Ingresa la placa a buscar:');
  if (!placa) return;
  const placaUp = placa.trim().toUpperCase();
  if (vehiculos[placaUp]) {
    const { entrada, puesto } = vehiculos[placaUp];
    const { cobro, ms } = calcCobro(entrada);
    document.getElementById('panelOpResult').innerHTML = `
      <div class="msg msg-ok">
        🔍 <b>Vehículo encontrado</b><br>
        Placa: <b>${placaUp}</b> — Puesto: <b>${puesto}</b><br>
        Tiempo: <b>${formatDur(ms)}</b><br>
        Cobro aprox: <b>${formatCOP(cobro)}</b>
      </div>`;
  } else {
    document.getElementById('panelOpResult').innerHTML =
      `<div class="msg msg-warn">⚠️ La placa <b>${placaUp}</b> no está registrada como activa.</div>`;
  }
}
