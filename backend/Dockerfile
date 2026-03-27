# Imagen base ligera
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos primero para cache
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY . .

# Exponer puerto del API
EXPOSE 5000

# Iniciar servidor
CMD ["npm", "start"]
