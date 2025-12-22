# ===========================================
# 腾讯云 Docker 部署配置
# 支持 CloudBase + 微信支付 + 支付宝
# ===========================================

# 使用官方 Node.js 运行时作为基础镜像 (云托管优化)
FROM node:20-alpine AS base

# 安装 pnpm 和必要的系统依赖
RUN npm install -g pnpm@8 && \
    apk add --no-cache libc6-compat curl wget

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# ===========================================
# 依赖安装阶段 - 利用 Docker 层缓存
# ===========================================
FROM base AS deps
# 安装所有依赖（包括 devDependencies 用于构建）
# 处理 pnpm lockfile 兼容性问题
RUN pnpm install --frozen-lockfile --prod=false --force || \
    (rm -f pnpm-lock.yaml && pnpm install --prod=false) || \
    npm install

# ===========================================
# 构建阶段 - 腾讯云优化
# ===========================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置腾讯云云托管部署相关的环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DEPLOYMENT_REGION=cn
ENV CLOUDBASE_BUILD=true

# CloudBase 和支付相关的环境变量（在部署时通过 ARG 或 ENV 设置）
ARG NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID
ARG NEXT_PUBLIC_WECHAT_CLOUDBASE_ID
ARG CLOUDBASE_SECRET_ID
ARG CLOUDBASE_SECRET_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=$NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID
ENV NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=$NEXT_PUBLIC_WECHAT_CLOUDBASE_ID
ENV CLOUDBASE_SECRET_ID=$CLOUDBASE_SECRET_ID
ENV CLOUDBASE_SECRET_KEY=$CLOUDBASE_SECRET_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# 构建应用
RUN pnpm build

# ===========================================
# 生产运行阶段 - 腾讯云优化
# ===========================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEPLOYMENT_REGION=cn

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 设置正确的权限
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 腾讯云健康检查配置
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server.js"]

