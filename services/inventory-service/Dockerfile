FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm@10.23.0
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3002

CMD ["pnpm", "start"]
