// Script post-build para asegurar que _redirects esté en la raíz de dist
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const redirectsSource = path.join(__dirname, 'public', '_redirects');
const redirectsDest = path.join(distPath, '_redirects');

// Verificar que dist existe
if (!fs.existsSync(distPath)) {
  console.error('❌ El directorio dist no existe. Ejecuta el build primero.');
  process.exit(1);
}

// Copiar _redirects a la raíz de dist si existe en public
if (fs.existsSync(redirectsSource)) {
  fs.copyFileSync(redirectsSource, redirectsDest);
  console.log(`✅ Archivo _redirects copiado a: ${redirectsDest}`);
} else {
  // Si no existe, crearlo directamente en dist
  const redirectsContent = '/*    /index.html   200\n';
  fs.writeFileSync(redirectsDest, redirectsContent, 'utf8');
  console.log(`✅ Archivo _redirects creado en: ${redirectsDest}`);
}

