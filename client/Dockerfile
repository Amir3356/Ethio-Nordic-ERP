FROM node:24.18.0-alpine

WORKDIR /app

# Copy dependency files first for Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]