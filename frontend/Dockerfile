# ============================================================
# FSMS Frontend Dockerfile — Node 20 Alpine + Vite Dev Server
# ============================================================
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests first (layer cache optimisation)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm install --legacy-peer-deps

# Force-install packages that have React 19 peer dependency conflicts
RUN npm install react-to-print react-leaflet leaflet recharts --force

# Copy the rest of the source code
# NOTE: node_modules is excluded via .dockerignore
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# Start Vite in development mode (host 0.0.0.0 set in vite.config.js)
CMD ["npm", "run", "dev"]
