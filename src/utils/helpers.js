/* HELPERS.JS — Funciones de utilidad
   Archivo: src/utils/helpers.js */

/* ---- Formato moneda COP ---- */
function formatCOP(v) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v);
}

/* ---- Formato duración ---- */
function formatDur(ms) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/* ---- Calcular cobro real según el tiempo transcurrido ---- */
function calcCobro(entrada) {
  const ms      = new Date() - entrada;
  const minutos = Math.ceil(ms / 60000);
  const cobro   = Math.max(COBRO_MINIMO, minutos * TARIFA_MIN);
  return { cobro, ms, minutos };
}

/* ---- Obtener y validar la placa de un campo de texto ----
   idCampo: id del input de placa a leer.
   contenedorMsg: id del contenedor donde mostrar el mensaje de error. */
function getPlaca(idCampo = 'placa', contenedorMsg = 'resultado') {
  const v = document.getElementById(idCampo).value.trim().toUpperCase();
  if (!v) {
    msg('⚠️ Ingresa la placa del vehículo.', 'warn', contenedorMsg);
    return null;
  }
  const regexPlaca = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/;
  if (!regexPlaca.test(v.replace(/\s/g, ''))) {
    msg('⚠️ Formato de placa inválido. Usa letras y números (ej: ABC123).', 'warn', contenedorMsg);
    return null;
  }
  return v.replace(/\s/g, '');
}

/* ---- Filtrar input de placa: solo letras y números, con feedback visual ---- */
function filtrarPlaca(input, idHint = 'placaHint') {
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
    hint.textContent = '✅ Formato de placa válido';
    hint.className = 'placa-hint hint-ok';
  } else if (limpio.length < 6) {
    hint.textContent = `Faltan ${6 - limpio.length} caracteres...`;
    hint.className = 'placa-hint hint-warn';
  } else {
    hint.textContent = '❌ Formato inválido — 3 letras + 3 números';
    hint.className = 'placa-hint hint-error';
  }
}

/* ---- Primer puesto libre ---- */
function puestoLibre() {
  for (let i = 1; i <= CAPACIDAD; i++) {
    if (!ocupados.has(i)) return i;
  }
  return null;
}
