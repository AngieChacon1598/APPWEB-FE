# Guía de Despliegue en Render - Frontend Angular

## Configuración en Render Dashboard

### Paso 1: Crear el Servicio

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Static Site"**
3. Conecta tu repositorio Git del frontend
4. Selecciona el repositorio y la rama (ej: `main` o `develop`)

### Paso 2: Configurar el Servicio

#### Configuración Básica:

- **Name**: `appweb-fe` (o el nombre que prefieras)
- **Branch**: `main` (o la rama que uses)
- **Root Directory**: Déjalo vacío (a menos que tu Angular esté en una subcarpeta)

#### Build Command:

```bash
npm install && npm run build:prod
```

O si usas yarn:

```bash
yarn install && yarn build:prod
```

#### Publish Directory:

```
dist
```

(Angular genera los archivos en el directorio `dist` por defecto)

### Paso 3: Variables de Entorno

En la sección **"Environment"**, agrega:

```
NG_APP_API_URL=https://appweb-be.onrender.com
```

**Nota**: 
- Render reconstruirá la aplicación cuando cambies variables de entorno
- El script `build-env.js` leerá esta variable y generará el archivo de entorno de producción
- Si no se define, usará `https://appweb-be.onrender.com` por defecto

### Paso 4: Desplegar

1. Haz clic en **"Create Static Site"**
2. Render comenzará a construir tu aplicación
3. El proceso puede tardar varios minutos la primera vez
4. Una vez completado, tendrás una URL como: `https://appweb-fe.onrender.com`

## Estructura de Archivos

El proyecto ahora incluye:

- `src/environments/environment.ts` - Entorno de desarrollo
- `src/environments/environment.prod.ts` - Entorno de producción (se genera automáticamente)
- `src/environments/conexion.ts` - Configuración de URL base (usa environment)
- `build-env.js` - Script que genera el archivo de entorno de producción
- `.env.production` - Referencia de variables de entorno (no se usa directamente)

## Verificación

1. Visita la URL proporcionada por Render
2. Abre la consola del navegador (F12) para verificar que no hay errores
3. Prueba hacer una petición al backend desde el frontend
4. Verifica que las peticiones se estén haciendo a `https://appweb-be.onrender.com`

## Solución de Problemas

### Error: "Failed to build"

- Verifica que el comando de build sea correcto: `npm run build:prod`
- Revisa los logs de build en Render Dashboard
- Asegúrate de que `package.json` tenga el script `build:prod`

### Error de CORS en el navegador

- Verifica que hayas actualizado la configuración CORS en el backend
- Asegúrate de que la URL del frontend esté en `allowedOrigins` del backend
- La URL será algo como: `https://appweb-fe.onrender.com`

### Las variables de entorno no funcionan

- Asegúrate de que la variable se llame `NG_APP_API_URL` o `API_URL`
- Verifica que el script `build-env.js` se ejecute antes del build
- Revisa los logs de build para ver qué URL se está usando

### El frontend no se actualiza

- Render reconstruye automáticamente cuando haces push
- Si no se actualiza, haz clic en **"Manual Deploy"** en Render Dashboard

## Notas Importantes

1. **Plan Gratuito**: En el plan gratuito, el sitio estático se "duerme" después de inactividad, pero se activa rápidamente.

2. **Actualizaciones Automáticas**: Render reconstruye automáticamente cuando haces push al repositorio.

3. **Variables de Entorno**: Las variables de entorno se inyectan durante el build mediante el script `build-env.js`.

4. **HTTPS**: Render proporciona HTTPS automáticamente.

5. **Custom Domain**: Puedes agregar un dominio personalizado en la configuración del servicio.

## Resumen Rápido

1. ✅ Crear servicio Static Site en Render
2. ✅ Build Command: `npm install && npm run build:prod`
3. ✅ Publish Directory: `dist`
4. ✅ Variable de entorno: `NG_APP_API_URL=https://appweb-be.onrender.com`
5. ✅ Actualizar CORS en backend para permitir `https://appweb-fe.onrender.com`
6. ✅ Deploy!

¡Listo! Tu frontend Angular estará desplegado en Render.

