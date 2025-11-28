FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/api-gateway/package.json ./services/api-gateway/
COPY packages ./packages

RUN npm install -g pnpm@10.23.0
RUN pnpm install --frozen-lockfile

COPY services/api-gateway ./services/api-gateway
COPY tsconfig.json ./

WORKDIR /app/services/api-gateway
RUN pnpm build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/main.js"]
