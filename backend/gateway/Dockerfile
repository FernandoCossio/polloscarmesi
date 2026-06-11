# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json yarn.lock ./

# Install all dependencies using yarn
RUN yarn install --frozen-lockfile

# Copy source code and config files
COPY . .

# Build the NestJS application
RUN yarn build

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
COPY --from=builder /app/package.json ./

# Create directories for static files and certificates to prevent crashes
RUN mkdir -p certs uploads

# Expose port (default is 4000)
EXPOSE 4000

# Run the app
CMD ["node", "dist/main"]
