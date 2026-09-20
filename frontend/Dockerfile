FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host 0.0.0.0 es obligatorio: sin esto, Vite solo escucha en localhost
# DENTRO del contenedor y el mapeo de puertos de docker-compose no puede
# alcanzarlo desde tu máquina.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
