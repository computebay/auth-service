# ---------- stage: base (install deps) ----------
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# copy minimal files for installing deps (speeds cache)
# include the prisma schema so `prisma generate` can run in the build stage
COPY package.json bun.lock prisma ./
# install deps (frozen lockfile ensures reproducible builds)
RUN bun install --frozen-lockfile

# ---------- stage: build (optional build step) ----------
FROM base AS build
# copy the rest of the source (including schema and generated output)
COPY . .

# Generate the Prisma client for the container OS so the correct query engine is present.
# Use `bun prisma generate` if Prisma is installed; fallback to the direct binary if needed.
RUN bun prisma generate --schema=prisma/schema.prisma || npx prisma generate --schema=prisma/schema.prisma || true

# Run your project's build script if present (keeps behavior compatible with earlier file)
RUN if [ -f package.json ] && grep -q '"build"' package.json; then bun run build; fi

# ---------- stage: final (small runtime) ----------
FROM oven/bun:1 AS final
WORKDIR /usr/src/app

# Copy only what we need from the build stage
# node_modules from base (installed deps) and built/generated source from build stage
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/src ./src
COPY --from=build /usr/src/app/package.json ./package.json

# Production env
ENV NODE_ENV=production
EXPOSE 3000

# Start command — your existing `start` script should work (bun supports TS runtime)
CMD ["bun", "run", "start"]
