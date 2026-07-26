# Multi-stage production Dockerfile for CoBuddy Companion Backend

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source code and build NestJS
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Execution
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy build artifacts & dependencies from builder
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4001

CMD ["node", "dist/src/main.js"]
