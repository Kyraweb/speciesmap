FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the Vite app
RUN npm run build

# If overview.html exists at repo root, publish it with the static build
RUN if [ -f overview.html ]; then cp overview.html dist/overview.html; fi

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

# Custom nginx config for SPA routing + /overview shortcut
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
