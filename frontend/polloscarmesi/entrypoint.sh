#!/bin/sh

# Si no está definida la variable API_URL, usar un default
if [ -z "$API_URL" ]; then
  echo "La variable de entorno API_URL no está definida. Usando valor por defecto: http://localhost:4000"
  export API_URL="http://localhost:4000"
fi

echo "Inyectando API_URL=$API_URL en los archivos compilados del frontend..."

# Reemplazar la URL en todos los archivos de JavaScript de la compilación
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|API_URL_PLACEHOLDER|$API_URL|g" {} +

echo "Inyección de variables completada. Iniciando Nginx..."

# Iniciar Nginx en primer plano
exec nginx -g "daemon off;"
