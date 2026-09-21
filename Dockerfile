# Portable image: builds the client and bundles the server, then runs the
# production build. Works as-is on Render, Fly, Railway and Cloud Run, all of
# which inject PORT (server.ts honours it).

FROM node:20-slim AS build
WORKDIR /app

# Dependencies first, so a source-only change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only what the bundled server needs at runtime.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY firebase-config.json ./

# Not root.
USER node

EXPOSE 3000
# The platform's own health check can use this too.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
