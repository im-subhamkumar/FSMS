# ============================================================
# FSMS Backend Dockerfile — Node 20 Slim
# ============================================================
FROM node:20-slim

# Install OpenSSL 3.0.x and wget (needed by Prisma and healthchecks)
RUN apt-get update && apt-get install -y openssl wget curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency manifests first
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Explicitly generate Prisma client for the current container environment
# Using --no-engine might help if we want to reduce size, but we need the engine.
RUN npx prisma generate

# Expose Express port
EXPOSE 3000

# Start with nodemon
CMD ["npm", "run", "dev"]
