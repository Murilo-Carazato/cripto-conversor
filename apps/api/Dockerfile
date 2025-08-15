# Dev image for API
FROM node:20-bookworm-slim

# System deps required for dev tooling and Prisma on Debian (glibc)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash curl ca-certificates openssl git openssh-client procps \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /usr/src/app

# Copy package files and install deps
COPY package.json pnpm-lock.yaml* ./
# Ensure Prisma schema exists before install because postinstall runs `prisma generate`
COPY prisma ./prisma
RUN pnpm install

# Copy source
COPY tsconfig.json ./
# prisma already copied above for postinstall
COPY src ./src

# Generate Prisma client
RUN pnpm prisma:generate || true

ENV NODE_ENV=development
ENV API_PORT=3001
EXPOSE 3001

# Default command overridden by compose
CMD ["pnpm", "dev"]
