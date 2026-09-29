FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=build /app/server/knowledge_store.json ./server/knowledge_store.json

RUN npm ci --omit=dev && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
