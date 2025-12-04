# Solución: Error "Not Found" en Frontend Angular en Render

## Problema

Al acceder a `https://appweb-fe.onrender.com`, aparece "Not Found" porque Render no está configurado para manejar las rutas de Angular (SPA - Single Page Application).

## Solución: Configurar Redirecciones en Render Dashboard

### Paso 1: Acceder a la Configuración

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu **Static Site** (`appweb-fe`)
3. Haz clic en **"Settings"** en el menú lateral

### Paso 2: Configurar Redirects/Rewrites

1. Busca la sección **"Redirects/Rewrites"** o **"Headers"**
2. Si existe la opción de Redirects, agrega:

   **Source (Fuente)**: `/*`
   **Destination (Destino)**: `/index.html`
   **Status Code**: `200` (Rewrite, no Redirect)

3. **Guarda los cambios**

### Paso 3: Si no hay opción de Redirects

Si Render no tiene una sección de Redirects visible, el archivo `_redirects` que ya creamos debería funcionar. Verifica:

1. **Revisa los logs de build** en Render para confirmar que `_redirects` se copió a `dist`
2. **Haz un "Manual Deploy"** para forzar un rebuild
3. **Espera 2-3 minutos** después del deploy para que los cambios surtan efecto

## Verificación del Archivo _redirects

El archivo `_redirects` debe estar en la raíz de `dist` después del build. El script `post-build.js` se encarga de esto automáticamente.

**Contenido del archivo `public/_redirects`:**
```
/*    /index.html   200
```

## Solución Alternativa: Verificar Build Output

Si el problema persiste, verifica que:

1. **El build se complete correctamente** - Revisa los logs en Render
2. **El directorio `dist` contenga `index.html`** - Debe estar en la raíz de `dist`
3. **El archivo `_redirects` esté en `dist`** - Debe estar en la raíz, no en una subcarpeta

## Configuración Completa en Render Dashboard

Asegúrate de que tu Static Site tenga esta configuración:

- **Build Command**: `npm install && npm run build:prod`
- **Publish Directory**: `dist`
- **Root Directory**: (vacío)
- **Branch**: `develop` (o la rama que uses)
- **Environment Variables**: 
  - `NG_APP_API_URL=https://appweb-be.onrender.com`

## Si el Problema Persiste

### Opción 1: Limpiar Caché

1. En Render Dashboard → Settings
2. Busca "Clear build cache & deploy"
3. Haz clic y espera a que se reconstruya

### Opción 2: Verificar que index.html existe

1. Revisa los logs de build
2. Busca la línea que dice "Output location: /opt/render/project/src/dist"
3. Verifica que `index.html` se haya generado

### Opción 3: Contactar Soporte de Render

Si ninguna de las soluciones funciona, puede ser un problema específico de Render. Contacta su soporte con:
- URL de tu sitio
- Logs de build
- Descripción del problema

## Nota Importante

Render para Static Sites **soporta archivos `_redirects`** (similar a Netlify), pero a veces necesita configuración adicional en el Dashboard. La mejor práctica es:

1. ✅ Tener el archivo `_redirects` en `public/` (ya lo tenemos)
2. ✅ Asegurarse de que se copie a `dist/` (el script `post-build.js` lo hace)
3. ✅ Configurar Redirects en el Dashboard si está disponible (opcional pero recomendado)

## Verificación Final

Después de aplicar la solución:

1. ✅ Espera 2-3 minutos después del deploy
2. ✅ Visita `https://appweb-fe.onrender.com`
3. ✅ Deberías ver tu aplicación Angular funcionando
4. ✅ Prueba navegar a diferentes rutas (ej: `/auth/login`, `/dashboard`)
5. ✅ Todas las rutas deberían funcionar correctamente

## Estado Actual del Proyecto

✅ **Ya implementado:**
- Archivo `public/_redirects` creado
- Script `post-build.js` que copia `_redirects` a `dist`
- Build command actualizado para ejecutar `post-build.js`

⏳ **Pendiente:**
- Verificar que Render detecte el archivo `_redirects`
- O configurar Redirects manualmente en el Dashboard si está disponible

