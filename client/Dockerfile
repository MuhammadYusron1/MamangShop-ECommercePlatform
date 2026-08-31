# ============================================================
#  client/Dockerfile — build & serve the React storefront
#  ============================================================
#  Multi-stage build:
#    Stage 1: install deps → run `vite build` → output to dist/
#    Stage 2: copy dist/ + nginx.conf → tiny nginx image
#
#  The result is a minimal image (~25MB) that serves the static
#  React app and proxies /api to the backend.
# ============================================================

# ---------- Stage 1: build the Vite app ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only package files first (Docker layer caching).
COPY package*.json ./

RUN npm install --legacy-peer-deps

# Now copy all source and run the build.
COPY . .
RUN npm run build   # outputs to /app/dist

# ---------- Stage 2: production nginx image ----------
FROM nginx:stable-alpine

# Copy our custom nginx config (proxies /api, serves static files).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output into nginx's default static dir.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (the outside port the browser connects to).
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]