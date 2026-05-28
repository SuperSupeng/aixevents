# Datawhale AI+X 活动日历

Datawhale AI+X 活动日历用于收录、筛选、订阅和展示 AI+X 生态活动。网站面向 AI 学习者、开发者、高校学生、产业从业者和个人创造者，支持生态伙伴提交活动，活动确认后进入公开日历。

## 功能

- AI+X 活动月历、周历、列表视图
- 按活动类型、城市、线上/线下和关键词筛选
- 活动提交、海报上传、确认后公开展示
- 无账号编辑链接：提交后可通过 token 链接修改活动
- 已公开活动修改进入待确认状态，不直接覆盖线上内容
- 日历订阅接口 `/api/calendar`
- Hackathon 独立页面
- Datawhale 品牌视觉与活动群二维码弹窗

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Database / Storage / RPC
- Cloudflare Workers Static Assets
- Vercel Functions 兼容保留

## 本地开发

```bash
npm install
npm run dev
```

本地需要 `.env.local`：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

服务端接口需要额外环境变量：

```bash
SUPABASE_SERVICE_ROLE_KEY=...
REVIEW_ADMIN_TOKEN=...
STATS_API_KEY=...
IP_HASH_SALT=...
```

## 数据库初始化

在 Supabase SQL Editor 执行：

```sql
-- 完整初始化
database/schema.sql
```

如果只需要修复权限策略，执行：

```sql
supabase_rls_setup.sql
```

海报 Storage 与编辑 RPC 也保留了独立修复脚本：

- `database/datawhale_storage_init.sql`
- `database/datawhale_edit_functions_init.sql`

## Cloudflare Workers 部署

推荐配置：

- Framework preset: `Vite`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build output directory: `dist`
- Node.js version: `20`

项目根目录的 `wrangler.jsonc` 会让 Wrangler 直接使用 `dist` 静态资源，并把 `/api/*` 交给 `src/worker.ts` 处理，避免 Wrangler 自动配置 Vite 时报 Vite 版本错误。

需要在 Cloudflare 的环境变量中配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_ADMIN_TOKEN`
- `STATS_API_KEY`
- `IP_HASH_SALT`

Worker 会提供：

- `/api/calendar`
- `/api/review-submission`
- `/api/stats`

## 审核与推荐

- 新提交活动默认 `review_status = pending`
- 设置 `review_status = approved` 后会通过 `datawhale_events_public` 展示
- 首页“本周推荐”由 `is_featured = true` 控制，`featured_rank` 数字越小越靠前
- 已公开活动通过 token 修改后，更新内容存入 `pending_update`，确认后再应用到公开字段

## 安全说明

安全模型与检查项见 [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)。
