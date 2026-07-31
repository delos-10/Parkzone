/* ============================================================
   MODEL-TURNO.JS — Turnos del operador y cálculo de nómina
   Archivo: src/models/model-turno.js
============================================================ */

/* ---- Abrir un turno para el operador actual ---- */
function registrarAperturaTurno(usuario, nombre) {
  turnoActivo = true;
  horaInicioTurno = new Date();
  operadorTurnoActual = { usuario, nombre };
}

/* ---- Cerrar el turno activo y guardarlo en el historial de turnos ---- */
function registrarCierreTurno() {
  if (!turnoActivo) return null;
  const fin = new Date();
  const horas = (fin - horaInicioTurno) / 3600000;
  const registro = {
    operador: operadorTurnoActual.usuario,
    nombre: operadorTurnoActual.nombre,
    inicio: horaInicioTurno,
    fin,
    horas
  };
  turnos.push(registro);
  turnoActivo = false;
  horaInicioTurno = null;
  operadorTurnoActual = null;
  return registro;
}

/* ---- Calcular nómina de todos los operadores según horas trabajadas ----
   Agrupa los turnos cerrados por operador y, si hay un turno activo en
   este momento, suma también las horas parciales que lleva trabajadas. */
function calcularNomina(tarifaHora) {
  const acumulado = {};

  turnos.forEach(t => {
    if (!acumulado[t.operador]) acumulado[t.operador] = { nombre: t.nombre, horas: 0 };
    acumulado[t.operador].horas += t.horas;
  });

  if (turnoActivo && operadorTurnoActual) {
    const horasActuales = (new Date() - horaInicioTurno) / 3600000;
    const op = operadorTurnoActual.usuario;
    if (!acumulado[op]) acumulado[op] = { nombre: operadorTurnoActual.nombre, horas: 0 };
    acumulado[op].horas += horasActuales;
    acumulado[op].enCurso = true;
  }

  return Object.entries(acumulado).map(([operador, d]) => ({
    operador,
    nombre: d.nombre,
    horas: d.horas,
    pago: d.horas * tarifaHora,
    enCurso: !!d.enCurso
  }));
}
