# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code and config files
COPY . .

# Build the NestJS application
RUN npm run build

# Prune devDependencies to keep image size small
RUN npm prune --production

# Stage 2: Run the production server
FROM node:20-alpine AS runner

WORKDIR /app

# Set environments
ENV NODE_ENV=production

# Copy built application and pruned node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/certs ./certs

# Create directories for static files and certificates to prevent crashes
RUN mkdir -p certs uploads

# Expose port (default is 3001)
EXPOSE 3001

# Run the app
CMD ["node", "dist/main"]
