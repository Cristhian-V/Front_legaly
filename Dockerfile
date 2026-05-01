# Etapa 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor de producción
FROM nginx:stable-alpine
# Copiamos la configuración personalizada de NGINX para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos los archivos compilados del frontend
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]