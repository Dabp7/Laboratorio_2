# Laboratorio 2 — adopciones y citas
Proyecto académico Node.js/Express/MongoDB. Catálogo de mascotas y reservas reproducibles con identidades ficticias.

## Ejecutar
Node22.15+ o24, npm y MongoDB8 replica set (Docker Compose opcional).
```sh
git clone https://github.com/Dabp7/Laboratorio_2.git
cd Laboratorio_2
npm ci
docker compose up -d --wait
cp .env.example .env
npm run seed
npm start
```
En PowerShell: Copy-Item .env.example .env. Configurar SECRETORPRIVATEKEY con32 caracteres o más.
API http://127.0.0.1:3003; GET /health.
Seed no destructivo solo adoption_demo: admin@example.test, alice@example.test y bob@example.test, contraseña Demo-password-123! Datos sintéticos.

## Demo
POST /adoptionSystem/v1/auth/login con email/password devuelve userDetails.token. Usar Authorization: Bearer en todas las rutas de mascotas, cuentas y citas.
GET /adoptionSystem/v1/pet/ muestra catálogo sin contacto del propietario.
POST /adoptionSystem/v1/appointment/createAppointment recibe pet y date; user se toma de la identidad, un admin puede elegirlo explícitamente.
Ejemplo date: timestamp futuro ISO con Z u offset, minuto UTC00 o30, segundos cero. Cada slot dura30 minutos.
GET /adoptionSystem/v1/appointment/:uid muestra citas activas propias (admin puede consultar otras).
PATCH /adoptionSystem/v1/appointment/updateDate/:id con newDate reprograma.
DELETE /adoptionSystem/v1/appointment/appointmentCancelled/:id cancela y libera el horario.
Dos solicitudes concurrentes por la misma mascota y slot producen una creación201 y un conflicto409. Una persona tampoco puede reservar dos mascotas en el mismo slot.

## Permisos
Un usuario administra su perfil y mascotas. Cambiar contraseña requiere oldPassword y newPassword de12..128 caracteres. El perfil no modifica rol/status/password. Un admin puede administrar catálogo y consultar cuentas. El registro público siempre crea USER_ROLE.
Desactivar mascota cancela citas activas en una transacción. La agenda y la baja requieren replica set. Datos históricos incompatibles con los índices deben revisarse antes de arrancar; no se eliminan automáticamente.

## Pruebas
npm test levanta un replica set MongoDB real temporal y prueba carreras de reservas/reprogramaciones, cancelación, permisos, datos del propietario y fechas inválidas.
La instalación npm ci no descarga MongoDB. La primera ejecución de las pruebas descarga el binario oficial 8.0.16 elegido por la suite; un mongod instalado puede usarse con MONGOMS_SYSTEM_BINARY. El timeout de arranque admite equipos lentos. CI ejecuta la misma suite.
.env, dumps e imágenes subidas se excluyen del árbol versionado. Credenciales históricas reales requieren rotación en su servicio.
La demo conserva su alcance académico; no es un sistema de agenda médica ni tiene pagos.
