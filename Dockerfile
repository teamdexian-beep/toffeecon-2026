# Production Dockerfile for ToffeeCon 2026 Interactive Engine
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose standard port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server/server.js"]
