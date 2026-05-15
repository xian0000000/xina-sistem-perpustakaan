# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl so prisma generate works correctly on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Generate prisma client in the runtime environment
RUN npx prisma generate

EXPOSE 8082

CMD ["sh", "-c", "npx prisma db push && npm run start"]