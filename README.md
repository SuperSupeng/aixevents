# Datawhale AI+X 活动日历

Datawhale AI+X 活动日历用于收录、筛选、订阅和展示 AI+X 生态活动。网站面向 AI 学习者、开发者、高校学生、产业从业者和个人创造者，支持生态伙伴提交活动，活动确认后进入公开日历。

## 功能

- AI+X 活动月历、周历、列表视图
- 按活动类型、城市、线上/线下和关键词筛选
- 活动提交、海报上传、确认后公开展示
- 无账号编辑链接：提交后可通过 token 链接修改活动
- 已公开活动修改进入待确认状态，不直接覆盖线上内容
- 后台管理 `/admin`：审核提交、编辑活动、确认更新、管理首页推荐位
- 日历订阅接口 `/api/calendar`
- Hackathon 独立页面
- Datawhale 品牌视觉与活动群二维码弹窗

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Database / Storage / RPC
- Cloudflare Pages / Pages Functions

## 本地开发

```bash
npm install
npm run dev
```

本地需要 `.env.local`：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PUBLIC_SITE_URL=https://你的正式域名
```

服务端接口需要额外环境变量：

```bash
SUPABASE_SERVICE_ROLE_KEY=...
REVIEW_ADMIN_TOKEN=...
STATS_API_KEY=...
IP_HASH_SALT=...
ADMIN_ALLOWED_ORIGINS=...
```

可从 `.env.example` 复制一份到 `.env.local` 后再填写。

本地 `npm run dev` 会为 `/api/admin/submissions` 挂载一个仅开发环境使用的 Vite middleware，方便 `/admin` 直接读取同一套管理接口逻辑。修改 `vite.config.ts` 或 `.env.local` 后需要重启 dev server。

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

## Cloudflare Pages 部署

推荐配置：

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: 留空
- Node.js version: `20`
- Production branch: `master`

项目使用 Cloudflare Pages Functions，`functions/api/*` 会提供服务端接口，`public/_redirects` 会把前端路由 fallback 到 `index.html`。

需要在 Cloudflare Pages 项目的 `Settings -> Environment variables` 中配置。注意：`VITE_*` 变量必须在构建时可用，配置后要重新部署，否则前端拿不到 Supabase 公开连接信息。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_ADMIN_TOKEN`
- `ADMIN_ALLOWED_ORIGINS`
- `STATS_API_KEY`
- `IP_HASH_SALT`

`VITE_PUBLIC_SITE_URL` 用于 canonical、Open Graph、Twitter Card 和结构化数据的绝对地址。绑定正式域名后，把它改成最终访问域名并重新部署。

Pages Functions 会提供：

- `/api/calendar`
- `/api/admin/submissions`
- `/api/review-submission`（兼容旧入口，307 跳转到 `/api/admin/submissions`）
- `/api/stats`

如果只想绑定子域名，不接管根域名，可以在 Pages 的 `Custom domains` 添加子域名，然后在当前 DNS 服务商添加 CNAME 指向 Pages 默认域名。

## 审核与推荐

- 新提交活动默认 `review_status = pending`
- 设置 `review_status = approved` 后会通过 `datawhale_events_public` 展示
- 首页“本周推荐”由 `is_featured = true` 控制，`featured_rank` 数字越小越靠前；最多展示 3 个尚未结束的当前有效推荐
- 后台“推荐中”只展示当前有效推荐，可拖拽调整展示顺序，保存后会重写 `featured_rank`
- 已公开活动通过 token 修改后，更新内容存入 `pending_update`，确认后再应用到公开字段
- 后台可直接编辑任意活动记录；保存后立即生效，并清理该记录已有的待更新内容
- 访问 `/admin` 后使用 `REVIEW_ADMIN_TOKEN` 登录；后台只调用服务端 `/api/admin/submissions`
- 后台审核、拒绝、直接编辑、推荐位修改会写入 `datawhale_admin_audit_logs` 审计表

已有数据库在上线后台编辑功能前，执行一次 `database/add_admin_update_audit_action.sql`，允许审计表记录 `update` 操作；全新环境直接执行 `database/schema.sql` 即可。

## 安全说明

安全模型与检查项见 [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)。
