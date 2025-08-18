# Base dev container image for monorepo editing (single-window)
FROM node:20-bookworm-slim

# Tools commonly needed by IDE servers and scripts + GitHub CLI
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash curl ca-certificates git openssh-client procps sudo \
       unzip xz-utils less \
    # Configure sudo for node user
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && rm -rf /var/lib/apt/lists/*

# pnpm is enabled via postCreateCommand in devcontainer.json

# Create workspace dir (devcontainers will mount bind here)
WORKDIR /workspaces/cripto-conversor

# Keep default user as root; devcontainer.json sets remoteUser: node
# Ensure node user exists (provided by base image)
