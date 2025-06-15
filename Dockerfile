# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# --- Builder stage ---
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Build arguments for public env vars (for Next.js static optimization)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY

# Install dependencies
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy application source (excluding files via .dockerignore)
COPY --link . .

# Build the Next.js app
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# Prune dev dependencies for production
RUN --mount=type=cache,target=/root/.npm \
    npm prune --production

# --- Production stage ---
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --ingroup appuser appuser

# Copy built app and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.js ./
COPY --from=builder /app/tailwind.config.js ./
COPY --from=builder /app/tailwind.config.ts ./
COPY --from=builder /app/styles ./styles/
COPY --from=builder /app/middleware.ts ./

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

USER appuser

EXPOSE 3000

CMD ["npm", "start"]
