# ============================================================
#  server/Dockerfile — build & run the Mamang Shop API
#  ============================================================
#  A "multi-stage" Docker build:
#    Stage 1 (builder): install all deps (incl. dev) to build.
#    Stage 2 (runner): copy in only production deps + source,
#                      producing a SMALL final image.
#
#  LEARNING NOTE — Docker multi-stage builds:
#  By separating dependency-install from the runtime image, the final
#  image stays small (no build tools, no dev deps like nodemon).
#  Smaller images = faster pulls, smaller attack surface, less disk.
#
#  NOTE: This image runs the Node process. MongoDB runs separately as
#  its own container, wired together by podman compose.
# ============================================================

# ---------- Stage 1: builder ----------
# Base image with Node 22 (alpine = small Linux distro).
FROM node:22-alpine AS builder

# Working directory inside the container for our app.
WORKDIR /app

# Copy ONLY the package files first. This leverages Docker layer
# caching: if package.json hasn't changed, the (expensive) `npm install`
# step is cached and not re-run on rebuilds.
COPY package*.json ./

# Install production dependencies only.
#   --omit=dev : skips devDependencies (nodemon etc.) — we don't need
#     build tools in the final image.
#   --legacy-peer-deps : avoids strict peer-dependency conflicts.
RUN npm install --omit=dev --legacy-peer-deps

# ---------- Stage 2: final runtime image ----------
FROM node:22-alpine

WORKDIR /app

# Set NODE_ENV so libraries optimize for production (no dev warnings).
ENV NODE_ENV=production

# Copy the production node_modules + all app source from Stage 1.
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# The port the server listens on (must match compose/published port).
EXPOSE 5000

# The command run when the container starts.
CMD ["node", "server.js"]
