# RestauranteLosPinos

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Despliegue en GitHub Pages (instrucciones rápidas)

Estas instrucciones te ayudan a publicar la aplicación en GitHub Pages usando el workflow de GitHub Actions que ya está incluido en este repositorio.

- URL esperada del sitio (si tu usuario/organización es `vallegrande` y el repositorio `AS241S4_T23_fe`):

  https://vallegrande.github.io/AS241S4_T23_fe/

- Pasos para desplegar usando el workflow (recomendado):

  1.  Asegúrate de que el archivo de workflow existe y está en la rama que vas a pushear: `.github/workflows/gh-pages.yml`.
  2.  Haz commit y push de los cambios al repositorio (por ejemplo la rama `develop` o `main`). Por ejemplo:

      ```bash
      git add .github/workflows/gh-pages.yml
      git commit -m "Add/update GH Pages workflow"
      git push origin develop
      ```

  3.  Abre GitHub → Actions → selecciona el workflow "Deploy to GitHub Pages" y revisa la ejecución. Si todo va bien, el paso de despliegue publicará la carpeta `dist/RestauranteLosPinos/browser` en la rama `gh-pages`.
  4.  Ve a Settings → Pages en el repositorio y confirma que la fuente sea la rama `gh-pages` (root). GitHub mostrará la URL pública.

- Comandos para probar localmente (opcional):

  ```bash
  # Build producción con base-href correcto (ajusta el nombre del repo si es necesario)
  npm run build -- --configuration production --base-href /AS241S4_T23_fe/

  # Servir el contenido generado localmente (usa http-server o serve)
  npx http-server ./dist/RestauranteLosPinos/browser -p 8080
  # o
  npx serve ./dist/RestauranteLosPinos/browser
  ```

- Deploy manual con `angular-cli-ghpages` (sin Actions):

  1.  Instala la herramienta (una sola vez):

      ```bash
      npm install --save-dev angular-cli-ghpages
      ```

  2.  Añade estos scripts a `package.json` (opcional):

      ```json
      "predeploy": "ng build --configuration production --base-href /AS241S4_T23_fe/",
      "deploy": "npx angular-cli-ghpages --dir=dist/RestauranteLosPinos/browser"
      ```

  3.  Ejecuta:

      ```bash
      npm run predeploy
      npm run deploy
      ```

- Problemas comunes y soluciones rápidas:
  - Si GitHub Actions falla con 403 al hacer push a `gh-pages`: asegúrate de que no estás ejecutando desde un fork y que el workflow tiene `permissions: pages: write` y `contents: write` (el workflow en este repo ya está configurado). Si el problema persiste en entornos con políticas estrictas, puedes crear un Personal Access Token (PAT) con permisos `repo` y guardarlo en `Settings → Secrets` como `PERSONAL_TOKEN`, y luego pasar ese token a la acción.
  - Si tu sitio muestra la página por defecto de Angular (la que viene en `README` generado), probablemente la acción publicó la carpeta equivocada. El workflow de este repositorio apunta a `dist/RestauranteLosPinos/browser` para Angular v20+.
  - Si ves 404 o rutas rotas: revisa que el `--base-href` usado al construir sea `/$REPO_NAME/` (donde `$REPO_NAME` es `AS241S4_T23_fe`).

Si quieres, puedo también añadir automáticamente los scripts `predeploy`/`deploy` a `package.json` o hacer el `git push` por ti desde este entorno (necesita que el remote y credenciales estén configurados). Dime qué prefieres.
