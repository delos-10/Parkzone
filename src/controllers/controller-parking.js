/* ============================================================
   CONTROLLER-PARKING.JS — Núcleo operativo del parqueadero (Optimizado)
   Archivo: src/controllers/controller-parking.js
============================================================ */

/* ---- RELOJ Y FECHA ---- */
function tick() {
  const n   = new Date();
  const pad = v => String(v).padStart(2, '0');
  const relojEl = document.getElementById('reloj');
  if (relojEl) {
    relojEl.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  }

  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fechaEl = document.getElementById('fecha');
  if (fechaEl) {
    fechaEl.textContent = `${dias[n.getDay()]}, ${n.getDate()} ${meses[n.getMonth()]} ${n.getFullYear()}`;
  }

  // Verificación automática de hora de reserva
  if (typeof verificarAutoOcupacionReservas === 'function') {
    verificarAutoOcupacionReservas();
  }
}

/* ---- MAPA DE PUESTOS (visible para todos los roles: ver espacios disponibles) ---- */
function initMapa() {
  const mapa = document.getElementById('mapa');
  if (!mapa) return;
  mapa.innerHTML = '';
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  for (let i = 1; i <= maxCap; i++) {
    const d = document.createElement('div');
    d.className = 'spot spot-libre';
    d.id = `p${i}`;
    d.title = `Puesto ${i} — Libre`;
    d.textContent = i;
    d.addEventListener('mouseenter', e => mostrarTooltipPuesto(i, e));
    d.addEventListener('mouseleave', () => ocultarTooltip());
    d.addEventListener('click', () => clickPuestoMapa(i));
    mapa.appendChild(d);
  }
  // Repintar los puestos que ya estén ocupados (por ejemplo al cambiar de rol)
  if (typeof vehiculos !== 'undefined') {
    Object.entries(vehiculos).forEach(([placa, { puesto }]) => setPuesto(puesto, true, placa));
  }
}

/* ---- INTERACCIÓN AL CLIQUEAR UN PUESTO DEL MAPA ---- */
function clickPuestoMapa(numPuesto) {
  if (typeof vehiculos === 'undefined') return;
  const entrada = Object.entries(vehiculos).find(([, v]) => v.puesto === numPuesto);

  if (!entrada) {
    msg(`🅿️ El <b>Puesto N° ${numPuesto}</b> está libre y disponible para estacionar.`, 'info');
    return;
  }

  const [placa, datos] = entrada;
  mostrarDetalleVehiculoPuesto(placa, numPuesto, datos);
}

/* ---- MODAL DETALLE DE VEHÍCULO AL CLIQUEAR UN PUESTO ---- */
function mostrarDetalleVehiculoPuesto(placa, numPuesto, datos) {
  const { cobro, ms, minutos } = calcCobro(datos.entrada);
  const reserva = datos.reservaId && typeof buscarReservaPorId === 'function' ? buscarReservaPorId(datos.reservaId) : null;
  const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { icono: '🚗', badge: 'Carro' };

  const modalHeadTitle = document.getElementById('modal-title') || document.querySelector('#overlay .modal-head h3');
  const modalHeadSub   = document.getElementById('modal-subtitle') || document.querySelector('#overlay .modal-head p');
  const modalBody      = document.getElementById('modal-body');
  const modalFoot      = document.querySelector('#overlay .modal-foot');

  if (modalHeadTitle) modalHeadTitle.textContent = `INFORMACIÓN DE VEHÍCULO — PUESTO N° ${numPuesto}`;
  if (modalHeadSub)   modalHeadSub.textContent   = `Datos guardados en tiempo real para la placa ${placa}`;

  if (modalBody) {
    modalBody.innerHTML = `
      <div class="modal-row"><span class="modal-key">🚘 Tipo de Vehículo</span><span class="modal-val">${infoV.badge}</span></div>
      <div class="modal-row"><span class="modal-key">${infoV.icono} Placa del Vehículo</span><span class="modal-val">${placa}</span></div>
      <div class="modal-row"><span class="modal-key">🅿️ Puesto Asignado</span><span class="modal-val">Puesto N° ${numPuesto}</span></div>
      ${reserva ? `
        <div class="modal-row"><span class="modal-key">👤 Propietario / Cliente</span><span class="modal-val">${reserva.nombreUsuario}</span></div>
        <div class="modal-row"><span class="modal-key">🚙 Vehículo</span><span class="modal-val">${reserva.marca} ${reserva.modelo} — ${reserva.color}</span></div>
      ` : ''}
      <div class="modal-row"><span class="modal-key">⏬ Hora de Entrada</span><span class="modal-val">${datos.entrada.toLocaleTimeString('es-CO')}</span></div>
      <div class="modal-row"><span class="modal-key">⏱ Tiempo Transcurrido</span><span class="modal-val tiempo-live" data-entrada="${datos.entrada.getTime()}">⏱ ${formatDur(ms)}</span></div>
      <div class="modal-row"><span class="modal-key">⏳ Minutos Transcurridos</span><span class="modal-val">${minutos} min</span></div>
      <div class="modal-row"><span class="modal-key">💲 Tarifa Aplicada</span><span class="modal-val">${formatCOP(typeof TARIFA_MIN !== 'undefined' ? TARIFA_MIN : 100)}/min</span></div>
      <div class="modal-total" style="margin-top:1rem">
        <span>💰 COBRO ACUMULADO AL MOMENTO</span>
        <span>${formatCOP(cobro)}</span>
      </div>
    `;
  }

  if (modalFoot) {
    modalFoot.innerHTML = `
      <button class="btn btn-entrada" onclick="prepararTicketSalida('${placa}')">🎟️ Generar Ticket de Salida y Cobrar</button>
      <button class="btn btn-salida" onclick="cerrarModal()">Cerrar</button>
    `;
  }

  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('show');
}

function setPuesto(n, ocup, placa = null) {
  const el = document.getElementById(`p${n}`);
  if (!el) return;
  if (ocup) {
    const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { icono: '🚗', badge: 'Carro' };
    el.className = 'spot spot-ocup spot-entrada-anim';
    el.textContent = infoV.icono;
    el.title = `Puesto ${n} — ${infoV.badge} (${placa || 'Ocupado'})`;
    setTimeout(() => el.classList.remove('spot-entrada-anim'), 600);
  } else {
    el.className = 'spot spot-libre spot-salida-anim';
    el.textContent = n;
    el.title = `Puesto ${n} — Libre`;
    setTimeout(() => el.classList.remove('spot-salida-anim'), 600);
  }
}

/* ---- TOOLTIP DE TIEMPO EN MAPA ---- */
function mostrarTooltipPuesto(numPuesto, e) {
  if (typeof vehiculos === 'undefined') return;
  const entrada = Object.entries(vehiculos).find(([, v]) => v.puesto === numPuesto);
  if (!entrada) return;

  const [placa, datos] = entrada;
  const { cobro, ms } = calcCobro(datos.entrada);
  const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { icono: '🚗', badge: 'Carro' };
  const tooltip = document.getElementById('spotTooltip');
  if (!tooltip) return;
  tooltip.innerHTML = `
    <div class="tt-title">Puesto ${numPuesto} (Clic para detalles)</div>
    <div class="tt-row"><span>${infoV.icono} Placa:</span><b>${placa}</b></div>
    <div class="tt-row"><span>🚘 Tipo:</span><b>${infoV.badge}</b></div>
    <div class="tt-row"><span>⏱ Tiempo:</span><b>${formatDur(ms)}</b></div>
    <div class="tt-row"><span>💰 Cobro aprox:</span><b>${formatCOP(cobro)}</b></div>
    <div class="tt-row"><span>📅 Entró:</span><b>${datos.entrada.toLocaleTimeString('es-CO')}</b></div>
  `;
  tooltip.style.display = 'block';
  
  // Posicionamiento inteligente del tooltip dentro de la ventana
  const x = Math.min(e.pageX + 12, window.innerWidth - 220);
  const y = Math.max(10, e.pageY - 10);
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function ocultarTooltip() {
  const tooltip = document.getElementById('spotTooltip');
  if (tooltip) tooltip.style.display = 'none';
}

/* ---- ACTUALIZAR STATS (ocupados/disponibles visibles para todos) ---- */
function actualizarStats() {
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  const ocup = typeof ocupados !== 'undefined' ? ocupados.size : 0;
  const lib  = maxCap - ocup;
  const pct  = Math.round((ocup / maxCap) * 100);

  const elOcup = document.getElementById('s-ocup');
  const elLib  = document.getElementById('s-lib');
  const elIng  = document.getElementById('s-ing');
  const elTot  = document.getElementById('s-tot');
  const elBar  = document.getElementById('ocu-bar');
  const elTxt  = document.getElementById('bar-pct-txt');
  const elLbl  = document.getElementById('bar-pct-lbl');

  if (elOcup) elOcup.textContent = ocup;
  if (elLib)  elLib.textContent  = lib;
  if (elIng)  elIng.textContent  = formatCOP(typeof ingresos !== 'undefined' ? ingresos : 0);
  if (elTot)  elTot.textContent  = typeof totalHoy !== 'undefined' ? totalHoy : 0;
  if (elBar)  elBar.style.width  = pct + '%';
  if (elTxt)  elTxt.textContent  = `${ocup} / ${maxCap} puestos`;
  if (elLbl)  elLbl.textContent  = `${pct}% ocupado`;
}

/* ---- LISTA DE ACTIVOS (operador/administrador) ---- */
function actualizarListaActivos() {
  const cont = document.getElementById('lista-activos');
  if (!cont) return;
  if (typeof vehiculos === 'undefined' || Object.keys(vehiculos).length === 0) {
    cont.innerHTML = '<div class="hist-empty">🅿️ No hay vehículos dentro</div>';
    return;
  }
  cont.innerHTML = '';
  Object.entries(vehiculos).forEach(([placa, { entrada, puesto }]) => {
    const { cobro, ms } = calcCobro(entrada);
    const durTxt = formatDur(ms);
    const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { icono: '🚗' };

    const d = document.createElement('div');
    d.className = 'hist-item hist-activo';
    d.style.cursor = 'pointer';
    d.onclick = () => mostrarDetalleVehiculoPuesto(placa, puesto, { entrada, puesto });
    d.innerHTML = `
      <span class="activo-car">${infoV.icono}</span>
      <span class="hist-placa">${placa}</span>
      <span class="hist-puesto">Puesto ${puesto}</span>
      <span class="hist-hora tiempo-live" data-entrada="${entrada.getTime()}">⏱ ${durTxt}</span>
      <span class="hist-monto">≈${formatCOP(cobro)}</span>
    `;
    cont.appendChild(d);
  });
}

/* ---- Actualizar todos los tiempos en vivo (lista activos + consulta usuario) ---- */
function actualizarTiemposVivos() {
  document.querySelectorAll('.tiempo-live').forEach(el => {
    const entradaMs = parseInt(el.dataset.entrada);
    if (!isNaN(entradaMs)) {
      const ms = new Date() - new Date(entradaMs);
      el.textContent = '⏱ ' + formatDur(ms);
    }
  });
}

/* ---- HISTORIAL MOVIMIENTOS ORGANIZADO & MEJORADO ---- */
function pushHistorial(tipo, placa, monto, puesto = null) {
  const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (typeof historial !== 'undefined') {
    historial.unshift({ tipo, placa, hora, monto, puesto });
  }
  renderHistorial();
}

function renderHistorial() {
  const cont = document.getElementById('historial');
  if (!cont) return;

  const listaHist = typeof historial !== 'undefined' ? historial.slice(0, 40) : [];

  if (listaHist.length === 0) {
    cont.innerHTML = `
      <div class="hist-empty">
        <div style="font-size:2rem;margin-bottom:0.4rem">📋</div>
        <div>No hay movimientos registrados en el turno</div>
      </div>`;
    return;
  }

  cont.innerHTML = '';
  listaHist.forEach(h => {
    const isEntrada = h.tipo.includes('Entrada');
    const isReserva = h.tipo.includes('Reserva');
    const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(h.placa) : { icono: '🚗' };

    let badgeClass = 'badge-s';
    let badgeStyle = 'background:#fff1f2; color:#9f1239; border:1px solid #fecdd3';
    let icon = '⬆️';

    if (isEntrada) {
      badgeClass = 'badge-e';
      badgeStyle = 'background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0';
      icon = '⬇️';
    } else if (isReserva) {
      badgeStyle = 'background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe';
      icon = '📅';
    }

    const d = document.createElement('div');
    d.className = 'hist-item hist-item-anim';
    d.style.display = 'flex';
    d.style.justifyContent = 'space-between';
    d.style.alignItems = 'center';
    d.style.padding = '0.75rem 1rem';
    d.style.marginBottom = '0.5rem';
    d.style.borderRadius = '12px';
    d.style.background = 'rgba(15, 23, 42, 0.75)';
    d.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    d.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';

    d.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap">
        <span class="badge ${badgeClass}" style="${badgeStyle};padding:0.25rem 0.55rem;border-radius:6px;font-size:0.75rem;font-weight:700">
          ${icon} ${h.tipo}
        </span>
        <span class="hist-placa" style="font-family:var(--font-mono);font-weight:800;font-size:0.92rem;color:#ffffff;background:rgba(30,41,59,0.8);padding:0.2rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12)">
          ${infoV.icono} ${h.placa}
        </span>
        ${h.puesto ? `<span style="font-size:0.78rem;font-weight:600;color:#cbd5e1;background:rgba(51,65,85,0.6);padding:0.18rem 0.45rem;border-radius:6px">🅿️ Puesto ${h.puesto}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem">
        <span class="hist-hora" style="font-family:var(--font-mono);font-size:0.8rem;color:#94a3b8">
          ⏱ ${h.hora}
        </span>
        ${h.monto != null ? `
          <span class="hist-monto" style="font-family:var(--font-mono);font-weight:800;font-size:0.92rem;color:#059669;background:#ecfdf5;padding:0.2rem 0.55rem;border-radius:6px;border:1px solid #a7f3d0">
            +${formatCOP(h.monto)}
          </span>` : ''}
      </div>
    `;
    cont.appendChild(d);
  });
}

/* ---- REGISTRO DE ENTRADA (operador/administrador) ---- */
function registrarEntrada() {
  const placa = getPlaca();
  if (!placa) return;

  if (vehiculos[placa]) {
    msg(`El vehículo <b>${placa}</b> ya está en el Puesto <b>${vehiculos[placa].puesto}</b>.`, 'error');
    return;
  }

  const puesto = puestoLibre();
  if (!puesto) {
    msg('🔴 <b>Parqueadero lleno.</b> No hay puestos disponibles.', 'error');
    return;
  }

  const reservaVinculada = typeof buscarReservaActivablePorPlaca === 'function' ? buscarReservaActivablePorPlaca(placa) : null;
  const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { badge: 'Carro' };

  vehiculos[placa] = { entrada: new Date(), puesto, reservaId: reservaVinculada ? reservaVinculada.id : null };
  ocupados.add(puesto);
  totalHoy++;

  if (reservaVinculada) {
    if (typeof activarReservaModel === 'function') activarReservaModel(reservaVinculada, puesto);
    if (typeof renderMisReservas === 'function') renderMisReservas();
    if (typeof renderReservasOperador === 'function') renderReservasOperador();
  }

  setPuesto(puesto, true, placa);
  actualizarStats();
  actualizarListaActivos();
  pushHistorial('Entrada', placa, null, puesto);
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  const hora = new Date().toLocaleTimeString('es-CO');
  const notaReserva = reservaVinculada ? ` (Reserva <b>${reservaVinculada.id}</b> vinculada)` : '';
  msg(`${infoV.badge} <b>${placa}</b> ingresado en Puesto <b>${puesto}</b> a las ${hora}.${notaReserva}`, 'ok');
  
  const elPlaca = document.getElementById('placa');
  if (elPlaca) elPlaca.value = '';
  const elHint = document.getElementById('placaHint');
  if (elHint) {
    elHint.textContent = 'Solo letras y números (ej: ABC123 | ABC12D)';
    elHint.className = 'placa-hint';
  }
}

/* ---- PREPARAR TICKET DE SALIDA (Apertura de Ticket para Confirmación de Pago) ---- */
function prepararTicketSalida(placaParam) {
  const placa = placaParam || getPlaca();
  if (!placa) return;

  if (!vehiculos[placa]) {
    msg(`El vehículo <b>${placa}</b> no está registrado como activo.`, 'error');
    return;
  }

  const { entrada, puesto, reservaId } = vehiculos[placa];
  const { cobro, ms, minutos } = calcCobro(entrada);
  const infoV = typeof getTipoVehiculoPorPlaca === 'function' ? getTipoVehiculoPorPlaca(placa) : { icono: '🚗', badge: 'Carro' };

  const horaE = entrada.toLocaleTimeString('es-CO');
  const horaS = new Date().toLocaleTimeString('es-CO');
  const folio = 'TK-' + String(Date.now()).slice(-6);

  const reserva = reservaId && typeof buscarReservaPorId === 'function' ? buscarReservaPorId(reservaId) : null;

  const modalHeadTitle = document.getElementById('modal-title') || document.querySelector('#overlay .modal-head h3');
  const modalHeadSub   = document.getElementById('modal-subtitle') || document.querySelector('#overlay .modal-head p');
  const modalBody      = document.getElementById('modal-body');
  const modalFoot      = document.querySelector('#overlay .modal-foot');

  if (modalHeadTitle) modalHeadTitle.textContent = `🎟️ TICKET DE SALIDA & COMPROBANTE DE PAGO`;
  if (modalHeadSub)   modalHeadSub.textContent   = `Folio N° ${folio} — Confirma el pago antes de autorizar la salida`;

  if (modalBody) {
    modalBody.innerHTML = `
      <div class="modal-row"><span class="modal-key">🎟️ Folio / Ticket</span><span class="modal-val">${folio}</span></div>
      <div class="modal-row"><span class="modal-key">🚘 Tipo de Vehículo</span><span class="modal-val">${infoV.badge}</span></div>
      <div class="modal-row"><span class="modal-key">${infoV.icono} Placa del Vehículo</span><span class="modal-val">${placa}</span></div>
      <div class="modal-row"><span class="modal-key">🅿️ Puesto Ocupado</span><span class="modal-val">N° ${puesto}</span></div>
      ${reserva ? `
        <div class="modal-row"><span class="modal-key">👤 Cliente / Reserva</span><span class="modal-val">${reserva.nombreUsuario} (${reserva.id})</span></div>
        <div class="modal-row"><span class="modal-key">🚙 Vehículo</span><span class="modal-val">${reserva.marca} ${reserva.modelo} — ${reserva.color}</span></div>
      ` : ''}
      <div class="modal-row"><span class="modal-key">⏬ Hora de Entrada</span><span class="modal-val">${horaE}</span></div>
      <div class="modal-row"><span class="modal-key">⏫ Hora de Salida</span><span class="modal-val">${horaS}</span></div>
      <div class="modal-row"><span class="modal-key">⏱ Tiempo de Estadía</span><span class="modal-val">${formatDur(ms)} (${minutos} min)</span></div>
      <div class="modal-row"><span class="modal-key">💲 Tarifa Aplicada</span><span class="modal-val">${formatCOP(typeof TARIFA_MIN !== 'undefined' ? TARIFA_MIN : 100)}/min</span></div>
      <div class="modal-total" style="margin-top:1rem">
        <span>💰 TOTAL A PAGAR (COP)</span>
        <span>${formatCOP(cobro)}</span>
      </div>
    `;
  }

  if (modalFoot) {
    modalFoot.innerHTML = `
      <button class="btn btn-entrada" style="background:linear-gradient(135deg,#059669,#047857);color:#fff" onclick="confirmarPagoSalidaTicket('${placa}', ${cobro}, ${puesto}, '${reservaId || ''}', '${folio}')">💵 Confirmar Pago y Dar Salida</button>
      <button class="btn btn-salida" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('show');
}

/* ---- REGISTRO DE SALIDA (operador/administrador) ---- */
function registrarSalida() {
  prepararTicketSalida();
}

/* ---- CONFIRMAR PAGO Y PROCESAR SALIDA DEFINITIVA ---- */
function confirmarPagoSalidaTicket(placa, cobro, puesto, reservaId, folio) {
  if (!vehiculos[placa]) {
    cerrarModal();
    return;
  }

  if (reservaId && typeof buscarReservaPorId === 'function') {
    const r = buscarReservaPorId(reservaId);
    if (r && typeof finalizarReservaModel === 'function') finalizarReservaModel(r, cobro);
    if (typeof renderMisReservas === 'function') renderMisReservas();
    if (typeof renderReservasOperador === 'function') renderReservasOperador();
  }

  delete vehiculos[placa];
  ocupados.delete(puesto);
  ingresos += cobro;

  setPuesto(puesto, false);
  actualizarStats();
  actualizarListaActivos();
  pushHistorial('Salida', placa, cobro);
  if (typeof guardarEstadoLocalStorage === 'function') guardarEstadoLocalStorage();

  cerrarModal();
  msg(`✅ <b>Pago confirmado (${formatCOP(cobro)})</b> - Ticket <b>${folio}</b>. Vehículo <b>${placa}</b> retirado del Puesto <b>${puesto}</b>.`, 'ok');

  const elPlaca = document.getElementById('placa');
  if (elPlaca) elPlaca.value = '';
}

/* ---- VER ESTADO (espacios disponibles) ---- */
function verEstado() {
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  const ocup = ocupados.size;
  const lib  = maxCap - ocup;
  const pct  = Math.round((ocup / maxCap) * 100);
  let estado = '🟢 Disponible';
  if (pct >= 90) estado = '🔴 Casi lleno';
  else if (pct >= 70) estado = '🟡 Llenándose';
  msg(`${estado} — <b>${ocup}</b> ocupados · <b>${lib}</b> disponibles · <b>${pct}%</b> de ocupación`, 'info');
}

/* ---- CERRAR MODAL COBRO ---- */
function cerrarModal() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('show');
}

/* ====================================================
   INICIO DEL APP
==================================================== */
function initApp() {
  initMapa();
  actualizarStats();
  actualizarListaActivos();
  tick();
  if (!window.__parkzoneIntervalsStarted) {
    setInterval(tick, 1000);
    setInterval(actualizarListaActivos, 10000);  // cada 10 seg
    setInterval(actualizarTiemposVivos,  1000);  // cada 1 seg
    window.__parkzoneIntervalsStarted = true;
  }
}

// Cerrar modal de cobro al hacer clic fuera de él
const overlayEl = document.getElementById('overlay');
if (overlayEl) {
  overlayEl.addEventListener('click', e => {
    if (e.target === overlayEl) cerrarModal();
  });
}
