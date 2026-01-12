# 🚀 PUNK BLVCK - Frontend Docker Image
# Multi-stage build para otimização máxima
# Produz imagem final de ~20MB

# ============ STAGE 1: Build Frontend ============
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências (incluindo dev) para build
RUN npm ci --silent && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# ============ STAGE 3: Runtime (Nginx) ============
FROM nginx:alpine AS runtime

# Configurar nginx para SPA - copiar apenas o frontend
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Configuração nginx otimizada para React Router
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    \
    # Gzip compression\
    gzip on;\
    gzip_vary on;\
    gzip_min_length 1024;\
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;\
    \
    # Cache headers para assets\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
    }\
    \
    # React Router - redirect all requests to index.html\
    location / {\
        try_files $uri $uri/ /index.html;\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        add_header Pragma "no-cache";\
        add_header Expires "0";\
    }\
    \
    # Enhanced Security headers\
    add_header X-Frame-Options "DENY" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header X-XSS-Protection "1; mode=block" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self' https:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self';" always;\
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;\
}' > /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expor porta 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]