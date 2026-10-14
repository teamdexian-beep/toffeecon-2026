# Production Dockerfile for ToffeeCon 2026 Interactive Engine
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose standard port (Conglomerate Port Matrix: 5000)
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server/server.js"]
