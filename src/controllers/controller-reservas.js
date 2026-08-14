/* ============================================================
   CONTROLLER-RESERVAS.JS — Reservas de usuario y administración
   Archivo: src/controllers/controller-reservas.js
============================================================ */

/* Etiquetas y colores (usando variables ya definidas en styles.css) por estado */
const ESTADO_RESERVA_INFO = {
  pendiente:  { texto: 'Pendiente',  style: 'background:#fffbeb;color:#92400e;border:1px solid #fde68a' },
  confirmada: { texto: 'Confirmada', style: 'background:#f0f9ff;color:#0369a1;border:1px solid #93c5fd' },
  activa:     { texto: 'Vehículo dentro', style: 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0' },
  finalizada: { texto: 'Finalizada', style: 'background:#f1f5f9;color:#334155;border:1px solid #cbd5e1' },
  cancelada:  { texto: 'Cancelada',  style: 'background:#fff1f2;color:#9f1239;border:1px solid #fecdd3' }
};

function badgeReserva(estado) {
  const info = ESTADO_RESERVA_INFO[estado] || ESTADO_RESERVA_INFO.pendiente;
  return `<span class="badge" style="${info.style}">${info.texto}</span>`;
}

/* ====================================================
   USUARIO — Crear una reserva
==================================================== */
function crearReservaUsuario() {
  if (!sesionActual) return;

  const placa = getPlaca('resPlaca', 'resultadoReserva');
  if (!placa) return;

  const marca  = document.getElementById('resMarca').value.trim();
  const modelo = document.getElementById('resModelo').value.trim();
  const color  = document.getElementById('resColor').value.trim();
  const fecha  = document.getElementById('resFecha').value;
  const horaEntrada = document.getElementById('resHoraEntrada').value;
  const horaSalida  = document.getElementById('resHoraSalida').value;

  if (!marca || !modelo || !color) {
    msg('⚠️ Completa la marca, modelo y color del vehículo.', 'warn', 'resultadoReserva');
    return;
  }
  if (!fecha || !horaEntrada || !horaSalida) {
    msg('⚠️ Selecciona la fecha y las horas de entrada y salida.', 'warn', 'resultadoReserva');
    return;
  }

  const reserva = crearReserva({
    usuario: sesionActual.usuario,
    nombreUsuario: sesionActual.nombre,
    placa, marca, modelo, color, fecha, horaEntrada, horaSalida
  });

  renderMisReservas();
  renderReservasOperador();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  msg(`✅ Reserva <b>${reserva.id}</b> creada para la placa <b>${placa}</b>. Costo estimado: <b>${formatCOP(reserva.costoEstimado)}</b>.`, 'ok', 'resultadoReserva');

  // Limpiar formulario
  document.getElementById('resPlaca').value = '';
  document.getElementById('resMarca').value = '';
  document.getElementById('resModelo').value = '';
  document.getElementById('resColor').value = '';
  document.getElementById('resHoraEntrada').value = '';
  document.getElementById('resHoraSalida').value = '';
  document.getElementById('placaHint2').textContent = 'Solo letras y números (ej: ABC123)';
  document.getElementById('placaHint2').className = 'placa-hint';
}

/* ====================================================
   USUARIO — Mostrar toda la información de mis reservas
   (fecha, hora de entrada y salida, costo, placa e info del vehículo)
==================================================== */
function renderMisReservas() {
  const cont = document.getElementById('lista-mis-reservas');
  if (!cont || !sesionActual) return;

  const propias = reservasDeUsuario(sesionActual.usuario);

  if (propias.length === 0) {
    cont.innerHTML = '<div class="hist-empty">📭 Aún no tienes reservas registradas</div>';
    return;
  }

  cont.innerHTML = '';
  propias.forEach(r => {
    const horaEntradaTxt = r.horaEntradaReal ? r.horaEntradaReal.toLocaleTimeString('es-CO') + ' (real)' : r.horaEntradaPlan + ' (planeada)';
    const horaSalidaTxt  = r.horaSalidaReal  ? r.horaSalidaReal.toLocaleTimeString('es-CO')  + ' (real)' : r.horaSalidaPlan  + ' (planeada)';
    const costoTxt = r.costoFinal != null ? `${formatCOP(r.costoFinal)} (final)` : `≈${formatCOP(r.costoEstimado)} (estimado)`;

    let accionUser = '';
    if (['pendiente', 'confirmada'].includes(r.estado)) {
      accionUser = `<button class="btn btn-entrada" style="padding:0.4rem 0.6rem;font-size:0.75rem;margin-top:0.3rem" onclick="ocuparReservaManual('${r.id}')">🚗 Ocupar puesto ahora (Ingreso)</button>`;
    } else if (r.estado === 'activa') {
      accionUser = `<button class="btn btn-salida" style="padding:0.4rem 0.6rem;font-size:0.75rem;margin-top:0.3rem" onclick="liberarReservaManual('${r.id}')">🏁 Registrar salida / Liberar puesto</button>`;
    }

    const d = document.createElement('div');
    d.className = 'hist-item hist-item-anim';
    d.style.flexDirection = 'column';
    d.style.alignItems = 'stretch';
    d.style.gap = '0.3rem';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="hist-placa">🚗 ${r.placa}</span>
        ${badgeReserva(r.estado)}
      </div>
      <div class="modal-row"><span class="modal-key">🚙 Vehículo</span><span class="modal-val">${r.marca} ${r.modelo} — ${r.color}</span></div>
      <div class="modal-row"><span class="modal-key">📅 Fecha de reserva</span><span class="modal-val">${r.fechaReserva}</span></div>
      <div class="modal-row"><span class="modal-key">⏬ Hora de entrada</span><span class="modal-val">${horaEntradaTxt}</span></div>
      <div class="modal-row"><span class="modal-key">⏫ Hora de salida</span><span class="modal-val">${horaSalidaTxt}</span></div>
      <div class="modal-row"><span class="modal-key">💲 Costo</span><span class="modal-val">${costoTxt}</span></div>
      ${r.puesto ? `<div class="modal-row"><span class="modal-key">🅿️ Puesto asignado</span><span class="modal-val">Puesto ${r.puesto}</span></div>` : ''}
      ${accionUser}
    `;
    cont.appendChild(d);
  });
}

/* ====================================================
   USUARIO — Visualizar en tiempo real si tiene un vehículo dentro
==================================================== */
function consultarMiVehiculo() {
  const placa = getPlaca('placaConsulta', 'resultadoMiVehiculo');
  if (!placa) return;

  const activo = vehiculos[placa];

  if (activo) {
    const { cobro, ms } = calcCobro(activo.entrada);
    document.getElementById('resultadoMiVehiculo').innerHTML = `
      <div class="msg msg-ok msg-anim" style="flex-direction:column;align-items:stretch;gap:0.4rem">
        <div>🟢 Tu vehículo <b>${placa}</b> está <b>dentro</b> del parqueadero.</div>
        <div class="modal-row"><span class="modal-key">🅿️ Puesto</span><span class="modal-val">${activo.puesto}</span></div>
        <div class="modal-row"><span class="modal-key">⏬ Hora de entrada</span><span class="modal-val">${activo.entrada.toLocaleTimeString('es-CO')}</span></div>
        <div class="modal-row"><span class="modal-key">⏱ Tiempo dentro</span><span class="modal-val tiempo-live" data-entrada="${activo.entrada.getTime()}">⏱ ${formatDur(ms)}</span></div>
        <div class="modal-row"><span class="modal-key">💲 Costo acumulado</span><span class="modal-val">≈${formatCOP(cobro)}</span></div>
      </div>`;
    return;
  }

  const reservaPendiente = buscarReservaActivablePorPlaca(placa);
  if (reservaPendiente) {
    msg(`🅿️ Tu vehículo <b>${placa}</b> aún no ha ingresado. Tienes una reserva <b>${reservaPendiente.estado}</b> (${reservaPendiente.id}) para el ${reservaPendiente.fechaReserva}.`, 'info', 'resultadoMiVehiculo');
    return;
  }

  msg(`Tu vehículo <b>${placa}</b> no se encuentra actualmente dentro del parqueadero.`, 'warn', 'resultadoMiVehiculo');
}

/* ====================================================
   OPERADOR / ADMINISTRADOR — Ver y administrar reservas actuales
==================================================== */
function renderReservasOperador() {
  const cont = document.getElementById('lista-reservas-operador');
  if (!cont) return;

  const lista = reservasPendientesYActivas();

  if (lista.length === 0) {
    cont.innerHTML = '<div class="hist-empty">📭 No hay reservas pendientes o activas</div>';
    return;
  }

  cont.innerHTML = '';
  lista.forEach(r => {
    const d = document.createElement('div');
    d.className = 'hist-item hist-item-anim';
    d.style.flexDirection = 'column';
    d.style.alignItems = 'stretch';
    d.style.gap = '0.3rem';

    let botones = '';
    if (r.estado === 'pendiente') {
      botones = `
        <button class="btn btn-op" style="padding:0.45rem;font-size:0.7rem" onclick="confirmarReservaOperador('${r.id}')">✅ Confirmar</button>
        <button class="btn btn-entrada" style="padding:0.45rem;font-size:0.7rem" onclick="ocuparReservaManual('${r.id}')">🚗 Ocupar Puesto</button>
        <button class="btn btn-salida" style="padding:0.45rem;font-size:0.7rem;grid-column:1/-1" onclick="cancelarReserva('${r.id}')">🚫 Cancelar</button>`;
    } else if (r.estado === 'confirmada') {
      botones = `
        <button class="btn btn-entrada" style="padding:0.45rem;font-size:0.7rem" onclick="ocuparReservaManual('${r.id}')">🚗 Ocupar Puesto Ahora</button>
        <button class="btn btn-salida" style="padding:0.45rem;font-size:0.7rem" onclick="cancelarReserva('${r.id}')">🚫 Cancelar</button>`;
    } else if (r.estado === 'activa') {
      botones = `
        <button class="btn btn-salida" style="padding:0.45rem;font-size:0.7rem;grid-column:1/-1" onclick="liberarReservaManual('${r.id}')">🏁 Registrar Salida / Liberar Puesto</button>`;
    }

    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="hist-placa">🚗 ${r.placa}</span>
        ${badgeReserva(r.estado)}
      </div>
      <div class="modal-row"><span class="modal-key">👤 Usuario</span><span class="modal-val">${r.nombreUsuario}</span></div>
      <div class="modal-row"><span class="modal-key">🚙 Vehículo</span><span class="modal-val">${r.marca} ${r.modelo} — ${r.color}</span></div>
      <div class="modal-row"><span class="modal-key">📅 Fecha</span><span class="modal-val">${r.fechaReserva}</span></div>
      <div class="modal-row"><span class="modal-key">⏬⏫ Horario</span><span class="modal-val">${r.horaEntradaPlan} - ${r.horaSalidaPlan}</span></div>
      ${r.puesto ? `<div class="modal-row"><span class="modal-key">🅿️ Puesto</span><span class="modal-val">Puesto ${r.puesto}</span></div>` : ''}
      ${botones ? `<div class="btn-grid" style="margin-top:0.2rem">${botones}</div>` : ''}
    `;
    cont.appendChild(d);
  });
}

function confirmarReservaOperador(id) {
  if (!['operador', 'administrador'].includes(sesionActual.rol)) return;
  confirmarReservaModel(id);
  renderReservasOperador();
  renderMisReservas();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
}

function cancelarReserva(id) {
  if (!sesionActual) return;
  if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
  cancelarReservaModel(id);
  renderReservasOperador();
  renderMisReservas();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
}

/* ---- OCUPAR PUESTO MANUALMENTE PARA RESERVA ---- */
function ocuparReservaManual(id) {
  const r = buscarReservaPorId(id);
  if (!r) return;
  if (['finalizada', 'cancelada'].includes(r.estado)) {
    alert('Esta reserva ya fue finalizada o cancelada.');
    return;
  }

  if (vehiculos[r.placa]) {
    alert(`El vehículo con placa ${r.placa} ya está dentro del parqueadero en el puesto ${vehiculos[r.placa].puesto}.`);
    return;
  }

  // Buscar primer puesto libre
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  let puestoLibre = null;
  for (let i = 1; i <= maxCap; i++) {
    if (!ocupados.has(i)) {
      puestoLibre = i;
      break;
    }
  }

  if (!puestoLibre) {
    alert('❌ El parqueadero está lleno. No hay puestos libres disponibles.');
    return;
  }

  // Ocupar puesto
  ocupados.add(puestoLibre);
  vehiculos[r.placa] = {
    entrada: new Date(),
    puesto: puestoLibre,
    reservaId: r.id
  };

  activarReservaModel(r, puestoLibre);

  if (typeof historial !== 'undefined') {
    historial.unshift({
      tipo: 'Entrada Reserva',
      placa: r.placa,
      puesto: puestoLibre,
      hora: new Date().toLocaleTimeString('es-CO')
    });
  }

  if (typeof setPuesto === 'function') setPuesto(puestoLibre, true, r.placa);
  if (typeof actualizarStats === 'function') actualizarStats();
  if (typeof renderHistorial === 'function') renderHistorial();
  renderReservasOperador();
  renderMisReservas();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  alert(`✅ Puesto ${puestoLibre} ocupado con éxito para el vehículo ${r.placa} (Reserva ${r.id}).`);
}

/* ---- LIBERAR PUESTO DE RESERVA ---- */
function liberarReservaManual(id) {
  const r = buscarReservaPorId(id);
  if (!r) return;

  const v = vehiculos[r.placa];
  const fechaEntrada = v ? v.entrada : (r.horaEntradaReal || new Date());
  const { cobro } = typeof calcCobro === 'function' ? calcCobro(fechaEntrada) : { cobro: r.costoEstimado };

  if (v) {
    ocupados.delete(v.puesto);
    if (typeof setPuesto === 'function') setPuesto(v.puesto, false);
    delete vehiculos[r.placa];
  }

  if (typeof ingresos !== 'undefined') ingresos += cobro;
  if (typeof totalHoy !== 'undefined') totalHoy += cobro;

  finalizarReservaModel(r, cobro);

  if (typeof historial !== 'undefined') {
    historial.unshift({
      tipo: 'Salida Reserva',
      placa: r.placa,
      puesto: r.puesto || '-',
      hora: new Date().toLocaleTimeString('es-CO'),
      monto: cobro
    });
  }

  if (typeof actualizarStats === 'function') actualizarStats();
  if (typeof renderHistorial === 'function') renderHistorial();
  renderReservasOperador();
  renderMisReservas();
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  alert(`✅ Salida registrada para reserva ${r.id} (${r.placa}). Total cobrado: ${typeof formatCOP === 'function' ? formatCOP(cobro) : '$' + cobro}`);
}

/* ---- VERIFICACIÓN AUTOMÁTICA DE HORA ESTIMADA DE RESERVA ---- */
function verificarAutoOcupacionReservas() {
  if (typeof reservas === 'undefined' || typeof vehiculos === 'undefined') return;

  const ahora = new Date();
  const hoyStr = ahora.toISOString().split('T')[0];
  const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();

  let cambio = false;

  reservas.forEach(r => {
    if (['pendiente', 'confirmada'].includes(r.estado) && !vehiculos[r.placa]) {
      // Verificar si la fecha es hoy o anterior y si la hora planeada ya llegó
      if (r.fechaReserva <= hoyStr) {
        const [hE, mE] = (r.horaEntradaPlan || '00:00').split(':').map(Number);
        const minPlan = hE * 60 + mE;

        // Si ya llegó o pasó la hora estimada de entrada
        if (horaActualMin >= minPlan) {
          const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
          let puestoLibre = null;
          for (let i = 1; i <= maxCap; i++) {
            if (!ocupados.has(i)) {
              puestoLibre = i;
              break;
            }
          }

          if (puestoLibre) {
            ocupados.add(puestoLibre);
            vehiculos[r.placa] = {
              entrada: new Date(),
              puesto: puestoLibre,
              reservaId: r.id
            };
            activarReservaModel(r, puestoLibre);

            if (typeof historial !== 'undefined') {
              historial.unshift({
                tipo: 'Entrada Auto Reserva',
                placa: r.placa,
                puesto: puestoLibre,
                hora: ahora.toLocaleTimeString('es-CO')
              });
            }

            if (typeof setPuesto === 'function') setPuesto(puestoLibre, true, r.placa);
            cambio = true;
          }
        }
      }
    }
  });

  if (cambio) {
    if (typeof actualizarStats === 'function') actualizarStats();
    if (typeof renderHistorial === 'function') renderHistorial();
    renderReservasOperador();
    renderMisReservas();
    if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();
  }
}
