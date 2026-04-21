# Admin Login MFA Flow (HU-P-22)

Este documento describe el flujo implementado para autenticación de administradores con MFA en el portal web-admin y su relación con backend, gateway, Postman y base de datos.

## 1. Objetivo

Implementar login administrativo con doble factor (TOTP), manteniendo la misma base de datos de usuarios que ya usa viajeros.

## 2. Cambios de base de datos

Se agregó el script SQL:

- microservices/usuarios/sql/20260418_add_admin_mfa_columns.sql

Columnas nuevas en user_accounts:

- role
- status
- mfa_secret_encrypted
- mfa_enabled
- mfa_confirmed_at
- failed_login_attempts
- locked_until
- updated_at

Defaults de compatibilidad:

- role = VIAJERO
- status = ACTIVE
- mfa_enabled = false
- failed_login_attempts = 0

## 3. Endpoints nuevos (Gateway)

Base URL: /api/v1

- POST /admin/auth/register
- POST /admin/auth/verify-setup
- POST /admin/auth/login/step1
- POST /admin/auth/login/step2

Estos endpoints se proxyean hacia microservices/usuarios.

## 4. Flujo funcional

1. Registrar admin
- Se crea usuario con role ADMIN y status PENDING_MFA.
- Se genera secret TOTP.
- El secret se guarda cifrado (no en texto plano).
- Respuesta incluye setup_url y otpauth_uri.

2. Enrolamiento en Google Authenticator
- El administrador escanea el QR generado a partir de otpauth_uri.

3. Verificar setup MFA
- Llamar verify-setup con email + code de 6 dígitos.
- Si es válido:
  - mfa_enabled = true
  - status = ACTIVE
  - mfa_confirmed_at = now

4. Login
- Step 1: valida email/usuario + contraseña y retorna challenge_token.
- Step 2: valida challenge_token + código TOTP y retorna JWT.

5. Web-admin
- Login exitoso redirige a /dashboard.
- Dashboard inicial es una página mínima con texto Dashboard.

## 5. Seguridad

- Contraseña hasheada con bcrypt.
- Secret TOTP cifrado con clave de entorno MFA_SECRET_ENCRYPTION_KEY.
- JWT incluye claim role.
- Login admin aplica bloqueo temporal por intentos fallidos.

## 6. Variables de entorno clave

En microservices/usuarios:

- JWT_SECRET_KEY
- MFA_SECRET_ENCRYPTION_KEY
- MFA_ISSUER
- ADMIN_SETUP_BASE_URL
- ADMIN_MAX_LOGIN_ATTEMPTS
- ADMIN_LOCK_MINUTES
- ADMIN_MFA_CHALLENGE_EXPIRES

## 7. Pruebas con Postman

Colección agregada:

- postman/Admin_Auth_MFA.postman_collection.json

Orden recomendado:

1. Register Admin
2. Verify Setup
3. Admin Login Step 1
4. Admin Login Step 2
5. Current User (Auth Me)

## 8. Notas operativas

- El código MFA cambia cada ~30 segundos en la app autenticadora.
- Si verify-setup falla, generar código nuevo y reintentar.
- Si login step1 bloquea usuario, esperar el tiempo de lock configurado.
