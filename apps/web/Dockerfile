FROM node:20-alpine

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
