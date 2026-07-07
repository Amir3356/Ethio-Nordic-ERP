FROM node:24.18.0-alpine


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


EXPOSE 5173


CMD ["npm","run","dev","--","--host"]