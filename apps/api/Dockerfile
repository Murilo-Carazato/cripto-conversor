# Dev image for API
FROM node:20-alpine

# System deps required by Prisma on Alpine (musl)
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /usr/src/app

# Copy package files and install deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN pnpm prisma:generate || true

ENV NODE_ENV=development
ENV API_PORT=3001
EXPOSE 3001

# Default command overridden by compose
CMD ["pnpm", "dev"]
