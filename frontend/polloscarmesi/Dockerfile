# Stage 1: Build Angular Application
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx and dynamically inject variables
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Eliminar archivos default de nginx
RUN rm -rf ./*

# Copiar el compilado de Angular (desde dist/sakai-ng/browser debido al nuevo compiler application builder)
COPY --from=build /app/dist/sakai-ng/browser /usr/share/nginx/html

# Copiar el script entrypoint.sh y darle permisos de ejecucion
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
