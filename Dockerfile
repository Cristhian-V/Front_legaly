# Etapa 1: Construcción
FROM node:16-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor de producción
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Si usas React Router, necesitarás una conf de nginx para las rutas
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]