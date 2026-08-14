# ParkZone — Sistema de Parqueadero

## Estructura del Proyecto
```
ParkZone/
├── index.html                             ← Archivo principal (SPA)
└── src/
    ├── controllers/
    │   ├── controller-auth.js             ← Login, sesiones y permisos por rol
    │   ├── controller-parking.js          ← Mapa, reloj, stats, entradas/salidas
    │   ├── controller-reservas.js         ← Reservas: crear, consultar, administrar
    │   ├── controller-operador.js         ← Turnos, reporte rápido, buscar vehículo
    │   └── controller-admin.js            ← Tarifa, dashboard, nómina, reset, exportar
    ├── models/
    │   ├── model-datos.js                 ← Estado global y configuración
    │   ├── model-reserva.js               ← Lógica de datos de las reservas
    │   └── model-turno.js                 ← Turnos del operador y cálculo de nómina
    ├── utils/
    │   ├── helpers.js                     ← Formato, validación de placa, cálculo de cobro
    │   └── alerts.js                      ← Renderizador genérico de mensajes
    └── views/
        ├── css/
        │   └── styles.css                 ← Estilos (sin cambios)
        └── images/                        ← Imágenes (vacío por ahora)
```

## Cuentas del sistema
| Rol           | Usuario   | Contraseña | Funciones                                                              |
|---------------|-----------|------------|--------------------------------------------------------------------------|
| Usuario       | usuario   | user123    | Reservar espacio, ver espacios disponibles, ver si su vehículo está dentro, ver el detalle de sus reservas |
| Operador      | operador  | op2024     | Ver y administrar reservas, registrar entradas/salidas, turnos, reportes |
| Administrador | admin     | admin2024  | Todo lo anterior + Dashboard general + Nómina de operadores              |

## Funcionalidades por rol

### Usuario
- **Reservar un espacio**: crea una reserva indicando placa, marca, modelo, color, fecha y horario estimado.
- **Ver espacios disponibles**: mapa de puestos y estadísticas de ocupación en tiempo real.
- **Mi vehículo en tiempo real**: consulta si su vehículo está actualmente dentro del parqueadero (puesto, tiempo y costo acumulado).
- **Mis reservas**: lista completa con fecha, hora de entrada y salida (planeada/real), costo (estimado/final), placa e información del vehículo.

### Operador
- **Reservas actuales**: visualiza todas las reservas pendientes, confirmadas y activas.
- **Administrar reservas**: confirmar o cancelar reservas de los usuarios.
- **Registrar entrada/salida**: al ingresar una placa con reserva, esta se vincula y activa automáticamente; al salir, la reserva se finaliza con el costo real.
- **Panel del operador**: abrir/cerrar turno (registra horas para la nómina), reporte rápido y búsqueda de vehículos.

### Administrador
- Todas las funciones de Usuario y Operador en conjunto.
- **Dashboard**: vista general con ocupación, ingresos, estado de las reservas y turnos activos.
- **Nómina de operadores**: calcula el pago de cada operador según las horas trabajadas (registradas en sus turnos) y una tarifa por hora configurable.
- Configurar tarifa por minuto, informe completo, resetear sistema y exportar datos (incluye reservas y turnos).

## Otras características
- Login con 3 tipos de sesión.
- Validación de placa (solo letras y números, formato colombiano).
- Cobro de parqueo por MINUTO (no por hora).
- Tooltip al pasar por un puesto: muestra placa, tiempo y cobro estimado.
- Animaciones en el mapa de puestos al entrar/salir.

> Nota: este proyecto no usa backend ni almacenamiento persistente; todo el estado (reservas, vehículos, turnos) vive en memoria del navegador mientras la pestaña esté abierta.
