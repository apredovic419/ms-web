FROM node:20.18-alpine AS builder
WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN npx update-browserslist-db@latest

COPY . .

RUN pnpm build

FROM node:20.18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]