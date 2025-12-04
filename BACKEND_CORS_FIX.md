# Corrección de CORS en el Backend

## Problema Actual

Tu archivo `WebConfig.java` tiene un problema: no puedes usar `"*"` junto con orígenes específicos en `allowedOrigins`.

## Solución

Actualiza tu archivo `src/main/java/pe/edu/vallegrande/restLosPinos/config/WebConfig.java`:

### ❌ Código Actual (Incorrecto):

```java
.allowedOrigins(
    "https://vallegrande.github.io",
    "http://localhost:4200",
    "http://localhost:3000",
    "https://appweb-fe.onrender.com",
    "*"  // ❌ Esto no es válido
)
```

### ✅ Código Corregido:

```java
.allowedOrigins(
    "https://vallegrande.github.io",
    "http://localhost:4200",
    "http://localhost:3000",
    "https://appweb-fe.onrender.com"
    // ✅ Removido el "*" - no es necesario y causa conflictos
)
```

## Código Completo Corregido

```java
package pe.edu.vallegrande.restLosPinos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                                "https://vallegrande.github.io",
                                "http://localhost:4200",
                                "http://localhost:3000",
                                "https://appweb-fe.onrender.com"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}
```

## Notas Importantes

1. **No uses `"*"` con orígenes específicos**: Spring no permite mezclar `"*"` con orígenes específicos en `allowedOrigins`.

2. **Si necesitas permitir todos los orígenes**: Usa solo `"*"` pero NO puedes usar `allowCredentials(true)` con `"*"`.

3. **Para desarrollo local**: Los orígenes `localhost:4200` y `localhost:3000` están incluidos.

4. **Para producción**: `https://appweb-fe.onrender.com` está incluido.

5. **Después de cambiar**: Reinicia el servicio del backend en Render para que los cambios surtan efecto.

