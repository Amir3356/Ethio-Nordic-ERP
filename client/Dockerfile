FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY client/package.json client/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY client/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
