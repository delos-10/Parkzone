/* 
   MODEL-DATOS.JS — Estado global y configuración del sistema
   Archivo: src/models/model-datos.js
*/

// ---- CONFIGURACIÓN ----
const CAPACIDAD            = 50;
let   TARIFA_MIN            = 100;    // $ por minuto de parqueo (editable por admin)
let   COBRO_MINIMO          = 100;    // cobro mínimo en $
let   TARIFA_HORA_OPERADOR  = 8000;   // $ por hora trabajada (nómina, editable por admin)

// ---- ESTADO DEL PARQUEADERO ----
let vehiculos = {};         // { placa: { entrada, puesto, reservaId } }
let ocupados  = new Set();  // conjunto de puestos ocupados
let historial = [];         // array de movimientos (entradas/salidas)
let ingresos  = 0;
let totalHoy  = 0;

// ---- RESERVAS ----
let reservas = [];          // array de objetos reserva (ver model-reserva.js)
let contadorReservaId = 1;

// ---- TURNOS DE OPERADOR (para nómina) ----
let turnoActivo         = false;
let horaInicioTurno     = null;
let operadorTurnoActual = null; // { usuario, nombre }
let turnos = [];            // historial de turnos cerrados { operador, nombre, inicio, fin, horas }
