/* ============================================================
   MODEL-RESERVA.JS — Lógica de datos de las reservas
   Archivo: src/models/model-reserva.js
============================================================ */

/* ---- Calcular costo estimado de una reserva según horario planeado ---- */
function calcularCostoEstimadoReserva(horaEntrada, horaSalida) {
  const [hE, mE] = horaEntrada.split(':').map(Number);
  const [hS, mS] = horaSalida.split(':').map(Number);
  let minutos = (hS * 60 + mS) - (hE * 60 + mE);
  if (minutos <= 0) minutos += 24 * 60; // la reserva cruza la medianoche
  return Math.max(COBRO_MINIMO, minutos * TARIFA_MIN);
}

/* ---- Crear una nueva reserva ---- */
function crearReserva({ usuario, nombreUsuario, placa, marca, modelo, color, fecha, horaEntrada, horaSalida }) {
  const reserva = {
    id: 'R' + String(contadorReservaId++).padStart(4, '0'),
    usuario,
    nombreUsuario,
    placa,
    marca,
    modelo,
    color,
    fechaReserva: fecha,
    horaEntradaPlan: horaEntrada,
    horaSalidaPlan: horaSalida,
    estado: 'pendiente',       // pendiente -> confirmada -> activa -> finalizada | cancelada
    puesto: null,
    horaEntradaReal: null,
    horaSalidaReal: null,
    costoEstimado: calcularCostoEstimadoReserva(horaEntrada, horaSalida),
    costoFinal: null,
    creada: new Date()
  };
  reservas.unshift(reserva);
  return reserva;
}

/* ---- Consultas ---- */
function reservasDeUsuario(usuario) {
  return reservas.filter(r => r.usuario === usuario);
}

function reservasPendientesYActivas() {
  return reservas.filter(r => ['pendiente', 'confirmada', 'activa'].includes(r.estado));
}

function buscarReservaPorId(id) {
  return reservas.find(r => r.id === id);
}

/* Busca una reserva "activable" (aún no ingresada) para vincularla a una entrada física */
function buscarReservaActivablePorPlaca(placa) {
  return reservas.find(r => r.placa === placa && ['pendiente', 'confirmada'].includes(r.estado));
}

/* ---- Cambios de estado ---- */
function confirmarReservaModel(id) {
  const r = buscarReservaPorId(id);
  if (r && r.estado === 'pendiente') r.estado = 'confirmada';
  return r;
}

function cancelarReservaModel(id) {
  const r = buscarReservaPorId(id);
  if (r && ['pendiente', 'confirmada'].includes(r.estado)) r.estado = 'cancelada';
  return r;
}

function activarReservaModel(reserva, puesto) {
  reserva.estado = 'activa';
  reserva.puesto = puesto;
  reserva.horaEntradaReal = new Date();
}

function finalizarReservaModel(reserva, costoFinal) {
  reserva.estado = 'finalizada';
  reserva.horaSalidaReal = new Date();
  reserva.costoFinal = costoFinal;
}
