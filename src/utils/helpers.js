/* ============================================================
   HELPERS.JS — Funciones de utilidad (Optimizadas)
   Archivo: src/utils/helpers.js
============================================================ */

/* ---- Formato moneda COP ---- */
function formatCOP(v) {
  const num = Number(v) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num);
}

/* ---- Formato duración ---- */
function formatDur(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const m = Math.floor(safeMs / 60000);
  const h = Math.floor(m / 60);
  const s = Math.floor((safeMs % 60000) / 1000);
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/* ---- Calcular cobro real según el tiempo transcurrido ---- */
function calcCobro(entrada) {
  const fechaEntrada = entrada instanceof Date ? entrada : new Date(entrada);
  const ahora = new Date();
  const ms = Math.max(0, ahora - fechaEntrada);
  const minutos = Math.max(1, Math.ceil(ms / 60000));
  const tarifaBase = typeof TARIFA_MIN !== 'undefined' ? TARIFA_MIN : 100;
  const minCobro = typeof COBRO_MINIMO !== 'undefined' ? COBRO_MINIMO : 100;
  const cobro = Math.max(minCobro, minutos * tarifaBase);
  return { cobro, ms, minutos };
}

/* ---- Obtener y validar la placa de un campo de texto ---- */
function getPlaca(idCampo = 'placa', contenedorMsg = 'resultado') {
  const el = document.getElementById(idCampo);
  if (!el) return null;
  const v = el.value.trim().toUpperCase();
  if (!v) {
    msg('⚠️ Ingresa la placa del vehículo.', 'warn', contenedorMsg);
    return null;
  }
  const regexPlaca = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/;
  const limpio = v.replace(/\s/g, '');
  if (!regexPlaca.test(limpio)) {
    msg('⚠️ Formato de placa inválido. Usa letras y números (ej: ABC123).', 'warn', contenedorMsg);
    return null;
  }
  return limpio;
}

/* ---- Filtrar input de placa: solo letras y números, con feedback visual ---- */
function filtrarPlaca(input, idHint = 'placaHint') {
  if (!input) return;
  let val = input.value.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
  input.value = val;

  const hint = document.getElementById(idHint);
  if (!hint) return;
  const limpio = val.replace(/\s/g, '');

  if (limpio.length === 0) {
    hint.textContent = 'Solo letras y números (ej: ABC123)';
    hint.className = 'placa-hint';
    return;
  }

  const regexPlaca = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/;
  if (regexPlaca.test(limpio)) {
    const infoV = getTipoVehiculoPorPlaca(limpio);
    hint.textContent = `✅ Placa válida — ${infoV.badge}`;
    hint.className = 'placa-hint hint-ok';
  } else if (limpio.length < 6) {
    hint.textContent = `Faltan ${6 - limpio.length} caracteres... (Carro: ABC123 | Moto: ABC12D)`;
    hint.className = 'placa-hint hint-warn';
  } else {
    hint.textContent = '❌ Formato inválido — Carro (3 letras + 3 números) | Moto (3 letras + 2 números + 1 letra)';
    hint.className = 'placa-hint hint-error';
  }
}

/* ---- Identificar tipo de vehículo en Colombia (Carro vs Moto) ---- */
function getTipoVehiculoPorPlaca(placa) {
  if (!placa) return { tipo: 'Carro', icono: '🚗', badge: '🚗 Carro', esMoto: false };
  const p = placa.trim().toUpperCase().replace(/\s/g, '');
  const ultimoChar = p.charAt(p.length - 1);
  if (/[A-Z]/.test(ultimoChar)) {
    return { tipo: 'Moto', icono: '🏍️', badge: '🏍️ Moto', esMoto: true };
  } else {
    return { tipo: 'Carro', icono: '🚗', badge: '🚗 Carro', esMoto: false };
  }
}

/* ---- Primer puesto libre ---- */
function puestoLibre() {
  const maxCap = typeof CAPACIDAD !== 'undefined' ? CAPACIDAD : 50;
  for (let i = 1; i <= maxCap; i++) {
    if (!ocupados.has(i)) return i;
  }
  return null;
}
