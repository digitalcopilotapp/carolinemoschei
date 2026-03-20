FROM node:20-alpine

WORKDIR /app

# Copiar dependências primeiro (cache do Docker)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar diretório de logs
RUN mkdir -p logs

# Usuário não-root por segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webhook -u 1001 -G nodejs && \
    chown -R webhook:nodejs /app
USER webhook

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
