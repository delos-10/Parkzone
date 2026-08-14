/* ============================================================
   MODEL-DATOS.JS — Estado global, configuración y API LocalStorage
   Archivo: src/models/model-datos.js
============================================================ */

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

// ---- PERFILES DE USUARIOS Y GARAJE DE FAVORITOS ----
let perfilDatos = {
  usuario: {
    nombre: 'Bryan Gomez',
    email: 'j769928@gmail.com',
    telefono: '300 123 4567',
    icon: '👤',
    garaje: [
      { placa: 'KFD456', marca: 'Mazda', modelo: 'Mazda 3 2023', color: 'Rojo' }
    ]
  },
  operador: {
    nombre: 'Carlos Mora',
    email: 'operador@parkzone.com',
    telefono: '310 987 6543',
    icon: '🛂',
    garaje: []
  },
  admin: {
    nombre: 'Director ParkZone',
    email: 'admin@parkzone.com',
    telefono: '320 555 0000',
    icon: '👑',
    garaje: []
  }
};

/* ============================================================
   API LOCALSTORAGE PERSISTENCIA
============================================================ */
const STORAGE_KEY = 'PARKZONE_SYSTEM_DATA_V1';

/* ---- Guardar todo el estado actual en LocalStorage ---- */
function guardarEstadoLocalStorage() {
  try {
    const estadoGuardar = {
      config: {
        TARIFA_MIN,
        COBRO_MINIMO,
        TARIFA_HORA_OPERADOR
      },
      perfilDatos,
      vehiculos: Object.fromEntries(
        Object.entries(vehiculos).map(([placa, datos]) => [
          placa,
          {
            ...datos,
            entrada: datos.entrada instanceof Date ? datos.entrada.toISOString() : datos.entrada
          }
        ])
      ),
      ocupados: Array.from(ocupados),
      historial,
      ingresos,
      totalHoy,
      reservas: reservas.map(r => ({
        ...r,
        creada: r.creada instanceof Date ? r.creada.toISOString() : r.creada,
        horaEntradaReal: r.horaEntradaReal instanceof Date ? r.horaEntradaReal.toISOString() : r.horaEntradaReal,
        horaSalidaReal: r.horaSalidaReal instanceof Date ? r.horaSalidaReal.toISOString() : r.horaSalidaReal
      })),
      contadorReservaId,
      turno: {
        turnoActivo,
        horaInicioTurno: horaInicioTurno instanceof Date ? horaInicioTurno.toISOString() : horaInicioTurno,
        operadorTurnoActual,
        turnos: turnos.map(t => ({
          ...t,
          inicio: t.inicio instanceof Date ? t.inicio.toISOString() : t.inicio,
          fin: t.fin instanceof Date ? t.fin.toISOString() : t.fin
        }))
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoGuardar));
  } catch (e) {
    console.warn('⚠️ No se pudo guardar en LocalStorage:', e);
  }
}

/* ---- Cargar estado guardado desde LocalStorage ---- */
function cargarEstadoLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    if (data.config) {
      if (typeof data.config.TARIFA_MIN === 'number') TARIFA_MIN = data.config.TARIFA_MIN;
      if (typeof data.config.COBRO_MINIMO === 'number') COBRO_MINIMO = data.config.COBRO_MINIMO;
      if (typeof data.config.TARIFA_HORA_OPERADOR === 'number') TARIFA_HORA_OPERADOR = data.config.TARIFA_HORA_OPERADOR;
    }

    if (data.perfilDatos) {
      perfilDatos = { ...perfilDatos, ...data.perfilDatos };
    }

    if (data.vehiculos) {
      vehiculos = {};
      Object.entries(data.vehiculos).forEach(([placa, d]) => {
        vehiculos[placa] = {
          ...d,
          entrada: d.entrada ? new Date(d.entrada) : new Date()
        };
      });
    }

    if (Array.isArray(data.ocupados)) {
      ocupados = new Set(data.ocupados);
    }

    if (Array.isArray(data.historial)) {
      historial = data.historial;
    }

    if (typeof data.ingresos === 'number') ingresos = data.ingresos;
    if (typeof data.totalHoy === 'number') totalHoy = data.totalHoy;

    if (Array.isArray(data.reservas)) {
      reservas = data.reservas.map(r => ({
        ...r,
        creada: r.creada ? new Date(r.creada) : new Date(),
        horaEntradaReal: r.horaEntradaReal ? new Date(r.horaEntradaReal) : null,
        horaSalidaReal: r.horaSalidaReal ? new Date(r.horaSalidaReal) : null
      }));
    }

    if (typeof data.contadorReservaId === 'number') contadorReservaId = data.contadorReservaId;

    if (data.turno) {
      turnoActivo = !!data.turno.turnoActivo;
      horaInicioTurno = data.turno.horaInicioTurno ? new Date(data.turno.horaInicioTurno) : null;
      operadorTurnoActual = data.turno.operadorTurnoActual || null;
      if (Array.isArray(data.turno.turnos)) {
        turnos = data.turno.turnos.map(t => ({
          ...t,
          inicio: t.inicio ? new Date(t.inicio) : new Date(),
          fin: t.fin ? new Date(t.fin) : new Date()
        }));
      }
    }
    return true;
  } catch (e) {
    console.warn('⚠️ Error cargando datos desde LocalStorage:', e);
    return false;
  }
}

// Cargar automáticamente al importar el modelo
cargarEstadoLocalStorage();
