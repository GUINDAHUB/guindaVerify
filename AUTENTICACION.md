# Sistema de Autenticación - GuindaVerify

## 🔐 Resumen del Sistema

Se ha implementado un sistema de autenticación sencillo con contraseñas simples para proteger tanto el área de administración como los portales de clientes.

## 📋 Configuración de la Base de Datos

### 1. Ejecutar el script de configuración

Si es la primera vez, ejecuta `supabase-setup.sql` en tu consola de Supabase.

Si ya tienes tablas creadas y te da errores de triggers existentes, ejecuta `fix-auth-setup.sql` en su lugar.

Los scripts incluyen:
- Tabla `auth_admin` para autenticación de administradores
- Campo `password_hash` en la tabla `clientes` para contraseñas de clientes
- Contraseña por defecto para administradores
- Manejo de conflictos para bases de datos existentes

### 2. Contraseña de administrador por defecto

**Contraseña inicial**: `admin123`

⚠️ **IMPORTANTE**: Cambia esta contraseña inmediatamente después de la primera configuración.

## 🔑 Uso del Sistema

### Para Administradores

1. **Acceder al panel de administración**:
   - Ve a `/admin`
   - Si no estás autenticado, serás redirigido a `/admin/login`
   - Introduce la contraseña de administrador

2. **Cambiar contraseña de administrador**:
   - Una vez en el panel, haz clic en "Cambiar Contraseña" en el header
   - Introduce tu contraseña actual y la nueva contraseña
   - La nueva contraseña debe tener al menos 6 caracteres

3. **Configurar contraseñas de clientes**:
   - En la tabla de clientes, haz clic en el icono de llave (🔑) 
   - Establece una contraseña para cada cliente
   - La contraseña debe tener al menos 6 caracteres

4. **Cerrar sesión**:
   - Haz clic en "Cerrar Sesión" en el header

### Para Clientes

1. **Acceder al portal**:
   - Ve a `/cliente/[codigo-cliente]`
   - Si no estás autenticado, serás redirigido a `/cliente/[codigo-cliente]/login`
   - Introduce la contraseña que te proporcionó el administrador

2. **Cerrar sesión**:
   - Haz clic en "Cerrar Sesión" en el header del portal

## 🛠️ Gestión de Contraseñas

### Cambiar contraseña de administrador

Puedes cambiar la contraseña desde la interfaz web o directamente en la base de datos:

```sql
-- Cambiar contraseña de administrador en la base de datos
-- (Reemplaza 'nueva_contraseña_hash' con el hash bcrypt de tu nueva contraseña)
UPDATE auth_admin 
SET password_hash = 'nueva_contraseña_hash' 
WHERE id = '00000000-0000-0000-0000-000000000000';
```

### Cambiar contraseña de cliente

Desde el panel de administración:
1. Ve a la tabla de clientes
2. Haz clic en el icono de llave (🔑) del cliente
3. Establece la nueva contraseña

O directamente en la base de datos:

```sql
-- Cambiar contraseña de cliente en la base de datos
UPDATE clientes 
SET password_hash = 'nueva_contraseña_hash' 
WHERE codigo = 'codigo-del-cliente';
```

## 🔒 Seguridad

### Características de seguridad implementadas

- **Hashing de contraseñas**: Se usa bcrypt para hashear todas las contraseñas
- **Cookies seguras**: Las sesiones se almacenan en cookies httpOnly
- **Redirecciones automáticas**: Los usuarios no autenticados son redirigidos a las páginas de login
- **Validación de longitud**: Las contraseñas deben tener al menos 6 caracteres
- **Separación de roles**: Los administradores y clientes tienen sistemas de autenticación separados

### Recomendaciones de seguridad

1. **Cambia la contraseña por defecto** inmediatamente
2. **Usa contraseñas fuertes** de al menos 8-12 caracteres
3. **Cierra sesión** cuando no uses el sistema
4. **No compartas contraseñas** por canales inseguros
5. **Cambia las contraseñas periódicamente**

## 🚀 URLs del Sistema

### Administración
- Panel principal: `/admin`
- Login: `/admin/login`
- Configuración: `/admin/configuracion`

### Clientes
- Portal del cliente: `/cliente/[codigo]`
- Login del cliente: `/cliente/[codigo]/login`

## 🆘 Solución de Problemas

### Error: "trigger already exists" al ejecutar SQL
- Esto ocurre cuando ya tienes algunas tablas creadas
- **Solución**: Usa el archivo `fix-auth-setup.sql` en lugar de `supabase-setup.sql`
- Este script maneja los conflictos con elementos existentes

### "Contraseña incorrecta"
- Verifica que estés usando la contraseña correcta
- Recuerda que las contraseñas son sensibles a mayúsculas y minúsculas
- Si acabas de ejecutar el script SQL, asegúrate de que se haya insertado el hash correcto

### "No autorizado"
- Tu sesión puede haber expirado
- Vuelve a hacer login
- Verifica que la tabla `auth_admin` se haya creado correctamente

### Olvidé la contraseña de administrador
- Puedes regenerar el hash ejecutando: `node scripts/generate-password-hash.js`
- O cambiarla directamente en la base de datos:
```sql
UPDATE auth_admin 
SET password_hash = '$2b$10$emtPXVzlPGz9Sw2J6YtBge6.n7.2HB7yoeLiSwiPjrzqMv2N3FYbW'
WHERE id = '00000000-0000-0000-0000-000000000000';
```

### Cliente no puede acceder
- Verifica que el código del cliente sea correcto en la URL
- Asegúrate de que se haya establecido una contraseña para ese cliente
- Verifica que el cliente esté marcado como activo
- Comprueba que el campo `password_hash` existe en la tabla `clientes`

### La tabla auth_admin no existe
- Ejecuta el script `fix-auth-setup.sql`
- Verifica que no haya errores en la consola de Supabase
- Comprueba que tienes permisos para crear tablas

## 📱 Compatibilidad

- ✅ Funciona en todos los navegadores modernos
- ✅ Compatible con dispositivos móviles
- ✅ Funciona en desarrollo y producción
- ✅ Cookies compatibles con HTTPS y HTTP

## 🔄 Actualizaciones Futuras

El sistema está diseñado para ser fácilmente extensible:

- Se puede agregar autenticación de dos factores
- Se pueden implementar roles más específicos
- Se puede agregar recuperación de contraseñas por email
- Se pueden implementar políticas de contraseñas más estrictas
