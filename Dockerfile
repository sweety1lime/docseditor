# syntax=docker/dockerfile:1

FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Runtime image: Node + a slim LibreOffice for the docx->pdf pipeline ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# libreoffice-writer (not the full suite) does the docx->pdf conversion.
# fonts-liberation ships Liberation Serif/Sans/Mono — metric-compatible
# substitutes for Times New Roman/Arial/Courier with full Cyrillic coverage,
# so generated PDFs render Cyrillic correctly even without the (Windows-
# licensed) original fonts installed on the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer \
      fonts-liberation \
      fontconfig \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

# DATABASE_URL must point at a real Postgres instance (e.g. the same Neon/
# Vercel Postgres project used for the Vercel deployment, or any other
# Postgres) — provide it at `docker run` time via -e or --env-file. There is
# no bundled database in this image.

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
