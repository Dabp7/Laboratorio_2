# Verificación 2026-11-27

Windows10, Node22.15.0, npm10.9.2 y MongoDB8.0.8 real en replica set temporal.
`npm test`: siete pruebas aprobadas, cero fallos.

- Diez solicitudes simultáneas por mascota y slot: una creación, nueve conflictos.
- Un usuario no ocupa dos mascotas en el mismo slot; cancelar libera disponibilidad.
- Reprogramar a un slot ocupado revierte el cambio y conserva la fecha original.
- Una cuenta no puede suplantar a otra ni leer/cancelar citas o editar mascotas ajenas.
- Desactivar una mascota cancela citas activas e impide nuevas reservas.
- Fechas, zona explícita, slots y paginación se validan.
- El catálogo no expone contacto del propietario y el perfil no eleva privilegios.

El binario se reutilizó con MONGOMS_SYSTEM_BINARY y versión comprobada externamente; la suite creó y limpió sus propios datos temporales. No usó la base personal.

Arranque desde una base vacía: seed, proceso real `node index.js`, health, login y catálogo con una mascota aprobados. El servidor espera todos los índices antes de escuchar y desconecta la base si falla el arranque.
`npm audit --omit=dev`: cero vulnerabilidades.

Revisión independiente adicional: subir una foto en un clon sin la carpeta de uploads reproducía 500/ENOENT. Dos cuentas que subían el mismo nombre en el mismo milisegundo también recibían la misma ruta y una imagen sobrescribía a la otra. Se reprodujeron ambas regresiones antes de corregirlas; la carpeta se crea de forma asíncrona y cada archivo recibe un UUID.

La suite final pasó nueve pruebas reales. Los casos nuevos verifican el contenido de los archivos guardados, aislamiento entre las dos imágenes y limpieza únicamente de sus propios temporales. `config.mongodbMemoryServer.disablePostinstall=true` fue confirmado por el resolver: npm ci no descarga un binario diferente al elegido por las pruebas. No cambian dependencias ni se usan imágenes personales.
