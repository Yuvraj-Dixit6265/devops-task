FROM node:18-alpine

WORKDIR /usr/src/app

COPY app/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY app/. .

EXPOSE 8080
CMD ["npm", "start"]
