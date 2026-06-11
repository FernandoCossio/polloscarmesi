# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=build /app/dist ./dist
# Si necesita las llaves públicas para la firma JWT:
COPY --from=build /app/certs ./certs

EXPOSE 4000
CMD ["node", "dist/main"]
