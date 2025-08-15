# Base dev container image for monorepo editing (single-window)
FROM node:20-bookworm-slim

# Tools commonly needed by IDE servers and scripts + GitHub CLI
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash curl ca-certificates git openssh-client procps sudo \
       unzip xz-utils less \
    # Configure sudo for node user
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    # GitHub CLI apt repo
    && mkdir -p -m 0755 /etc/apt/keyrings \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Create workspace dir (devcontainers will mount bind here)
WORKDIR /workspaces/cripto-conversor

# Keep default user as root; devcontainer.json sets remoteUser: node
# Ensure node user exists (provided by base image)
