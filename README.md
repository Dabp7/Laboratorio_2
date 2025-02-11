# API-2020527 - Sistema de Adopción de Mascotas

## Descripción
API-2020527 es un sistema de adopción de mascotas que proporciona endpoints para la gestión de usuarios, mascotas y citas. Permite registrar usuarios, gestionar mascotas disponibles para adopción y programar citas para la adopción de una mascota.

## Instalación
1. Clonar el repositorio:
   ```sh
   git clone https://github.com/tu_usuario/tu_repositorio.git
   ```
2. Acceder al directorio del proyecto:
   ```sh
   cd tu_repositorio
   ```
3. Instalar dependencias:
   ```sh
   npm install
   ```
4. Configurar variables de entorno en un archivo `.env`.
5. Iniciar el servidor:
   ```sh
   npm start
   ```

## Endpoints Disponibles
### Usuarios
- **Agregar Usuario** (POST)
  - URL: `http://localhost:3001/adoptionSystem/v1/auth/register`
  - Parámetros:
    - `name`: Nombre del usuario
    - `surname`: Apellido del usuario
    - `username`: Nombre de usuario
    - `email`: Correo electrónico
    - `password`: Contraseña
    - `profilePicture`: Imagen de perfil
    - `phone`: Teléfono
    - `role`: Rol del usuario

- **Actualizar Foto de Perfil** (PATCH)
  - URL: `http://localhost:3001/adoptionSystem/v1/user/updateProfilePicture/{id}`
  - Parámetros:
    - `profilePicture`: Nueva imagen de perfil

- **Buscar Usuario** (GET)
  - URL: `http://localhost:3001/adoptionSystem/v1/user/findUser/{id}`

- **Listar Usuarios** (GET)
  - URL: `http://localhost:3001/adoptionSystem/v1/user/`

- **Eliminar Usuario** (DELETE)
  - URL: `http://localhost:3001/adoptionSystem/v1/user/deleteUser/{id}`

- **Actualizar Usuario** (PUT)
  - URL: `http://localhost:3001/adoptionSystem/v1/user/updateUser/{id}`
  - Parámetros:
    - `name`: Nuevo nombre
    - `surname`: Nuevo apellido
    - `phone`: Nuevo teléfono

### Citas
- **Agregar Cita** (POST)
  - URL: `http://localhost:3001/adoptionSystem/v1/appointment/createAppointment`
  - Parámetros:
    - `date`: Fecha de la cita
    - `pet`: ID de la mascota
    - `user`: ID del usuario

- **Listar Citas** (GET)
  - URL: `http://localhost:3001/adoptionSystem/v1/appointment/{userId}`

- **Cancelar Cita** (DELETE)
  - URL: `http://localhost:3001/adoptionSystem/v1/appointment/appointmentCancelled/{id}`

- **Actualizar Cita** (PATCH)
  - URL: `http://localhost:3001/adoptionSystem/v1/appointment/updateDate/{id}`
  - Parámetros:
    - `newDate`: Nueva fecha de la cita

### Mascotas
- **Agregar Mascota** (POST)
  - URL: `http://localhost:3001/adoptionSystem/v1/pet/addPet`
  - Parámetros:
    - `name`: Nombre de la mascota
    - `description`: Descripción
    - `age`: Edad
    - `type`: Tipo de mascota
    - `email`: Email del responsable

- **Listar Mascotas** (GET)
  - URL: `http://localhost:3001/adoptionSystem/v1/pet/`

- **Buscar Mascota** (GET)
  - URL: `http://localhost:3001/adoptionSystem/v1/pet/findPet/{id}`

- **Actualizar Mascota** (PUT)
  - URL: `http://localhost:3001/adoptionSystem/v1/pet/updatePet/{id}`
  - Parámetros:
    - `name`: Nuevo nombre
    - `description`: Nueva descripción

- **Eliminar Mascota** (DELETE)
  - URL: `http://localhost:3001/adoptionSystem/v1/pet/deletePet/{id}`


