// Script para generar environment.prod.ts con variables de entorno
// Este script se ejecuta antes del build en Render
const fs = require('fs');
const path = require('path');

// Obtener la URL de la API desde variables de entorno
// Render usa NG_APP_ como prefijo para variables de entorno en Angular
const apiUrl = process.env.NG_APP_API_URL || process.env.API_URL || 'https://appweb-be.onrender.com';

const envContent = `// Archivo de entorno para producción
// Generado automáticamente durante el build
export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const envPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(envPath, envContent, 'utf8');

console.log(`✅ Archivo de entorno generado: ${envPath}`);
console.log(`✅ API URL configurada: ${apiUrl}`);

