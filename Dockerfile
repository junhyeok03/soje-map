FROM node:22-bookworm-slim AS build
WORKDIR /app

ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

COPY package.json package-lock.json ./
RUN npm ci

COPY .openai ./.openai
COPY app ./app
COPY build ./build
COPY public ./public
COPY worker ./worker
COPY next-env.d.ts next.config.ts postcss.config.mjs tsconfig.json vite.config.ts ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ARG NEXT_PUBLIC_BASE_PATH=""
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

COPY --chown=node:node --from=build /app/dist/standalone ./

EXPOSE 3000
USER node
CMD ["node", "server.js"]
