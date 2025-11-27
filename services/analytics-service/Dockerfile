FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY services/analytics-service ./services/analytics-service

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

WORKDIR /app/services/analytics-service

RUN pnpm build

EXPOSE 3004

CMD ["pnpm", "start"]
