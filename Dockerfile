# --- Etapa 1: Compilación ---
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Asegúrate de tener configurada tu URL de producción en tus variables de entorno (.env de frontend)
RUN npm run build

# --- Etapa 2: Servidor Web ---
FROM nginx:alpine
# Copiamos la carpeta 'dist' generada en la etapa anterior al Nginx del contenedor
COPY --from=build /app/dist /usr/share/nginx/html
# Configuramos Nginx internamente para que funcione con React Router
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]