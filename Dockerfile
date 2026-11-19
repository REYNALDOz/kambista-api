# --- Stage 1: install every dependency and compile TypeScript ---
FROM node:24-slim AS build
RUN npm install -g pnpm@11
WORKDIR /app

# The dependency files go first, so Docker reuses this layer while they do not change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
# Keep only what the running app needs.
RUN pnpm prune --prod

# --- Stage 2: the small image that actually runs ---
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Do not run as root.
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
