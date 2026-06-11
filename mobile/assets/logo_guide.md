# Guía de Configuración del Logo y Pantalla de Carga (Pollo Carmesí)

Esta guía explica cómo configurar y exportar el logotipo que adjuntaste para que se visualice correctamente como icono de la aplicación y pantalla de carga (splash screen) en Android, iOS y Web.

---

## 🎨 Especificaciones de las Imágenes

Expo requiere archivos específicos en formato **PNG** ubicados en la carpeta `assets/images/`. A continuación, se detallan las medidas y requerimientos para cada uno:

### 1. Icono General de la App (`icon.png`)
*   **Ruta recomendada**: `mobile/assets/images/icon.png`
*   **Dimensiones**: **1024 x 1024 píxeles** (cuadrado).
*   **Requisito de diseño**: Debe ser una imagen opaca (sin transparencias). Te sugerimos rellenar el fondo del cuadrado con el color crema de fondo del logo (`#FAF9F6`) para que el círculo marrón quede centrado y bien enmarcado en iOS y Web.

### 2. Iconos Adaptativos para Android
Android maneja iconos dinámicos que se componen de un frente transparente y un fondo de color plano:
*   **Frente (`android-icon-foreground.png`)**:
    *   **Ruta**: `mobile/assets/images/android-icon-foreground.png`
    *   **Dimensiones**: **1024 x 1024 píxeles**.
    *   **Diseño**: El logo de Pollo Carmesí centrado con **fondo transparente**.
*   **Fondo (`android-icon-background.png`)**:
    *   **Ruta**: `mobile/assets/images/android-icon-background.png`
    *   **Dimensiones**: **1024 x 1024 píxeles**.
    *   **Diseño**: Un cuadrado de color sólido crema (`#FAF9F6`) o marrón, según tu preferencia.

### 3. Pantalla de Carga (`splash-icon.png`)
*   **Ruta**: `mobile/assets/images/splash-icon.png`
*   **Dimensiones**: Mínimo **512 x 512 píxeles** (recomendado **1024 x 1024 píxeles**).
*   **Diseño**: El logotipo de Pollo Carmesí centrado y con **fondo transparente**.
*   *Nota: Expo centrará esta imagen automáticamente sobre el color de fondo configurado en `app.json`.*

### 4. Favicon de Navegador (`favicon.png`)
*   **Ruta**: `mobile/assets/images/favicon.png`
*   **Dimensiones**: **48 x 48 píxeles** (cuadrado).
*   **Diseño**: Logotipo reducido para pestañas web.

---

## ⚙️ Configuración en `app.json`

Una vez que guardes las imágenes en la carpeta `assets/images/`, asegúrate de que tu `app.json` (en la raíz de la carpeta `mobile/`) contenga las siguientes propiedades configuradas para apuntar a ellas:

```json
{
  "expo": {
    "name": "Pollo Carmesí",
    "slug": "pollo-carmesi",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "pollo-carmesi",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FAF9F6",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png"
      },
      "edgeToEdgeEnabled": true
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#FAF9F6",
          "dark": {
            "backgroundColor": "#1A1A1A"
          }
        }
      ]
    ]
  }
}
```

*Nota: Hemos configurado `"backgroundColor": "#FAF9F6"` en el plugin de la pantalla de carga para que el color de fondo de la carga coincida con el fondo crema de tu logotipo.*

---

## 🚀 Cómo verificar los cambios
1. Copia y reemplaza los archivos en la carpeta `mobile/assets/images/`.
2. Detén el Metro Bundler en tu terminal (`Ctrl + C`) si está corriendo.
3. Limpia la caché e inicia nuevamente el proyecto para forzar la carga de los nuevos assets:
   ```bash
   npx expo start --clear
   ```
4. Abre la app en **Expo Go** en tu celular; verás el nuevo logo en la pantalla de carga y en el icono de previsualización.
