# Production image for API
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
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json ./
# prisma already copied above for postinstall
COPY src ./src

# Ensure Prisma client is generated (postinstall already runs it)
RUN pnpm prisma:generate || true

# Build TypeScript to dist/
RUN pnpm build

ENV NODE_ENV=production
ENV API_PORT=3001
EXPOSE 3001

# Start in production (runs prestart to apply Prisma migrations)
CMD ["pnpm", "start"]
