# Imagen base ligera
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos primero para cache
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto del cliente
EXPOSE 3000

# Iniciar frontend
CMD ["npm", "start"]
