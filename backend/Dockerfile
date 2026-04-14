# ============================================================
# FSMS Backend Dockerfile — Node 18 Slim + Nodemon
# ============================================================
FROM node:20-slim

# Install OpenSSL and wget (needed by Prisma and compose healthcheck respectively)
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package.json package-lock.json* ./

# Install all dependencies including devDependencies (nodemon)
RUN npm install

# Copy source code
# node_modules excluded via .dockerignore
COPY . .

# Wait script / explicit DB push happens at runtime using the new docker:dev script
# This ensures it runs AFTER the database service is fully up
CMD ["npm", "run", "docker:dev"]
