# Reservas y permisos
La demo ofrece citas de30 minutos en instantes UTC alineados a :00 y :30.
La entrada debe ser ISO8601 con Z u offset explícito y fecha futura válida.
Un usuario no puede tener dos citas activas en el mismo slot y una mascota no puede ser reservada por dos personas en ese slot.
Índices únicos parciales para estados CREATED y ACCEPTED resuelven carreras entre procesos.
Cancelar libera el slot. Reprogramar usa el mismo contrato y conserva la cita original si hay conflicto.
Crear/reprogramar bloquea la fila de mascota dentro de una transacción MongoDB; desactivarla cancela citas en la misma transacción.
Cualquier usuario autenticado puede consultar el catálogo público de mascotas sin datos del propietario.
Solo el propietario o admin puede editar/desactivar una mascota, consultar cuenta o gestionar una cita.
Registro/perfil no asignan roles. Solo el propio usuario cambia contraseña aportando la anterior.
Se requiere MongoDB replica set; no se depende de memoria del servidor para controlar disponibilidad.

Instalaciones anteriores: normalizar o resolver manualmente reservas históricas duplicadas antes de crear los índices nuevos. El arranque falla si no puede garantizar unicidad; no borra datos para imponerla.
