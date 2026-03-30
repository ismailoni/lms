# Stage 1: Build
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run build

# Stage 2: Production image
FROM node:22

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.js ./prisma.config.js

ENV NODE_ENV=production
ENV PORT=8001

EXPOSE 8001

CMD ["node", "dist/index.js"]
