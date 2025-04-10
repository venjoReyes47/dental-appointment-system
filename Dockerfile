# Use Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port (match your app port)
EXPOSE 8080

# Start the app
CMD ["node", "Server.js"]
