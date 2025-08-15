FROM node:20-bookworm-slim

# Add tools required by IDEs and dev tooling on Debian (glibc)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash curl ca-certificates git openssh-client procps \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /usr/src/app

# Install deps first (better layer caching)
COPY package.json .
RUN pnpm install

# Copy the rest
COPY . .

EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
