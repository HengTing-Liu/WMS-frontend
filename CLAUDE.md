# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供本仓库的代码开发指引。

## 项目概述

本项目是基于 [Vue Vben Admin 5.0](https://vben.pro/) 开发的 **WMS（仓储管理系统）前端**，采用 Vue 3 + Vite + TypeScript 技术栈的 monorepo 架构。后端为 Java 项目（基于若依/RuoYi 框架），前后端通过 REST API 通信。

核心特点：
- **Monorepo**：pnpm workspace + Turbo
- **主应用**：`apps/web-antd` —— 基于 Ant Design Vue 的单页应用
- **后端集成**：所有路由、菜单、权限均从后端动态获取
- **低代码系统**：根据后端元数据动态生成表单和表格（`tableCode` → 元数据 → UI）
- **包管理器**：pnpm（通过 `preinstall` 钩子强制使用）
- **Node 版本**：>= 20.19.0，pnpm >= 10.0.0

## 常用命令

所有命令均在仓库根目录执行。

| 任务 | 命令 |
|------|---------|
| 安装依赖 | `pnpm install` |
| 启动开发服务（web-antd） | `pnpm dev` 或 `pnpm dev:antd` |
| 生产构建 | `pnpm build`（输出到 `./dist/`） |
| 开发模式构建 | `pnpm build:dev` |
| 预览生产构建 | `pnpm preview` |
| 类型检查 | `pnpm check:type` |
| 代码检查与格式化 | `pnpm lint` / `pnpm format` |
| 单元测试 | `pnpm test:unit` |
| E2E 测试 | `pnpm test:e2e` |
| 检查循环依赖 | `pnpm check:circular` |
| 检查依赖 | `pnpm check:dep` |
| 清理并重新安装 | `pnpm reinstall` |

`vsh` CLI（内部工具，位于 `scripts/vsh/`）负责代码检查、循环依赖检查和 publint。

## 架构

### Monorepo 目录结构

```
apps/
  web-antd/          # WMS 主应用（本项目唯一的应用）
  backend-mock/      # Nitro 模拟服务器（很少使用）
internal/
  lint-configs/      # ESLint、Prettier、Stylelint 配置
  node-utils/        # 构建工具
  tailwind-config/   # 共享 Tailwind 配置
  tsconfig/          # 共享 TypeScript 配置
  vite-config/       # 共享 Vite 配置（@vben/vite-config）
packages/
  @core/             # 核心设计系统、图标、共享类型、组合式函数、UI 套件
  effects/           # 功能包：权限、通用 UI、钩子、布局、插件、请求
  constants/         # 应用常量
  icons/             # 图标系统
  locales/           # 国际化基础设施
  preferences/       # 用户偏好状态
  stores/            # Pinia 状态（权限、用户、标签页等）
  styles/            # 全局样式
  types/             # 共享 TypeScript 类型
  utils/             # 共享工具函数
scripts/
  vsh/               # 内部 CLI，用于代码检查、依赖检查、循环依赖检查
  turbo-run/         # 交互式 `turbo run` 包装器
```

### 应用架构（`apps/web-antd`）

**启动流程**：`main.ts` → `initPreferences()` → `bootstrap()` → 挂载 Vue 应用。

**关键目录说明**：

- `src/adapter/` —— 将 Vben 的通用 UI 抽象层桥接到 Ant Design Vue。
  - `component/index.ts` —— 将所有表单/表格组件（Input、Select、Upload 等）注册到 Vben 的 `globalShareState`。新增表单组件必须在此添加对应的 `ComponentType` 声明。
  - `form.ts` —— 配置 Vben 表单，适配 Ant Design Vue 的模型绑定（`v-model:value`）。
  - `vxe-table.ts` —— 配置 vxe-table 默认参数和自定义单元格渲染器（CellImage、CellLink、CellOperation）。

- `src/api/` —— 按领域组织的 API 客户端模块（`core/`、`sys/`、`system/`、`wms/`、`inbound/`、`outbound/`、`qc/` 等）。
  - `request.ts` —— 配置 `RequestClient`，包含认证拦截器、Token 刷新和错误处理。后端响应格式：`{ code: 200, data: ..., msg: ... }`。
  - `index.ts` —— 统一重导出所有 API 函数。注意命名冲突（例如 `sys/dict` 与 `system/dictType`）。

- `src/router/` —— 动态路由系统。
  - `routes/core.ts` —— 静态路由（登录、个人中心、低代码表单全局路由）。**业务路由不放在此处。**
  - `routes/index.ts` —— `accessRoutes` 为空数组；所有业务路由均由后端生成。
  - `access.ts` —— 获取后端菜单（`getAllMenusApi`），映射组件（`Layout` → `BasicLayout`、`ParentView` → `RouteView`、`InnerLink` → `IFrameView`），解析 Vue 组件路径，去重路由名称，并应用 `keepAlive` 策略。
  - `guard.ts` —— 路由守卫处理：Token 校验、刷新时动态路由重建、重定向到首个可访问菜单、空壳根布局检测。

- `src/store/auth.ts` —— Pinia 认证状态，负责登录/登出/获取用户信息。`accessToken` 存储在 `useAccessStore` 中。登录成功后重定向到 `preferences.app.defaultHomePath`（默认：`/base/warehouse`）。

- `src/lowcode/` —— **低代码引擎**。根据后端元数据动态渲染页面：
  - `LowcodePage.vue` —— 动态表格/列表页
  - `LowcodeFormPage.vue` —— 动态新增/编辑/详情表单页
  - `LowcodeTreePage.vue` —— 动态树+表格页
  - `api.ts` —— 低代码元数据 API（`fetchColumnSchema`、`fetchTableMeta`、`fetchOperations`，CRUD 接口为 `/api/{module}/{entity}/...`）
  - `types.ts` —— 低代码类型定义

- `src/views/` —— Vue 页面组件。按领域组织（`sys/`、`system/`、`wms/`、`inbound/`、`outbound/`、`qc/`、`lowcode/` 等）。静态页面与低代码渲染页面共存。

- `src/locales/` —— 国际化。应用专属语言文件位于 `langs/`。Ant Design Vue 和 dayjs 语言包动态加载。

### 关键模式

**动态路由与菜单**：后端（`sys_menu` 表）提供完整菜单树。首次加载（或路由无法解析时），`access.ts` 调用 `getAllMenusApi()`，将树转换为 Vue Router 路由并动态添加。路由名称根据路径自动生成以避免冲突。

**低代码渲染**：`component === 'lowcode'` 或路径以 `/lowcode/` 开头的页面由低代码引擎渲染。引擎获取：
1. `TableMeta`（页面配置）
2. `ColumnMeta[]`（列表/表单字段 schema）
3. `TableOperation[]`（按钮/操作配置）
……然后动态渲染 vxe-table + Vben 表单。

**请求客户端**：使用 `@vben/request` 的 `RequestClient`。所有 API 调用通过 `requestClient`（返回 `response.data`）或 `baseRequestClient`（返回原始响应）。Bearer Token 自动附加。遇到 401 时，客户端尝试刷新 Token；刷新失败则重定向到登录页。

**适配器模式**：Vben 的 UI 套件（`@vben/common-ui`、`@vben/plugins/vxe-table`）是 UI 框架无关的。`adapter/` 层将其绑定到 Ant Design Vue。为低代码或表单新增组件时，需在 `adapter/component/index.ts` 注册。

**Keep-Alive 策略**：`access.ts` 对 `/sys/*`、`/system/*`、`/lowcode/*` 及特定质检页面应用 `keepAlive: true`。`fullPathKey: false` 防止基于完整路径的缓存键。

## 环境变量

`apps/web-antd/.env.development`：
- `VITE_PORT=5666` —— 开发服务端口
- `VITE_DEV_PROXY_TARGET=http://localhost:8087` —— 后端代理目标（Java 后端默认端口）
- `VITE_GLOB_API_URL=/` —— API 基础地址（通过代理转发）

`apps/web-antd/.env.production`：
- `VITE_PREVIEW_PORT=8082` —— 预览服务端口
- `VITE_ROUTER_HISTORY=hash` —— 生产环境路由模式
- `VITE_ARCHIVER=true` —— 构建时在仓库根目录生成 `dist.zip`

## 开发注意事项

- **构建输出**：`pnpm build` 输出到仓库根目录的 `dist/`（而非 `apps/web-antd/dist/`）。配置位于 `apps/web-antd/vite.config.mts`。
- **组件懒加载**：`adapter/component/index.ts` 中所有 Ant Design Vue 组件均使用 `defineAsyncComponent` 以实现 Tree Shaking。
- **Git 钩子**：lefthook 在 pre-commit 阶段运行 prettier、eslint、stylelint 和 commitlint。提交信息必须遵循 Conventional Commits 规范（由 commitlint 强制执行）。
- **Turbo 缓存**：构建输出由 Turbo 缓存。运行 `pnpm clean` 可清除缓存和 `node_modules`。
- **包版本管理**：依赖通过 pnpm catalog 管理（`pnpm-workspace.yaml` 的 `catalog:` 段）。使用 `pnpm update:deps` 升级版本。
- **字典/数据源命名冲突**：`api/index.ts` 显式重导出 `system/dictType` 函数以避免与 `sys/dict` 冲突。新增 API 模块时注意导出名称冲突。
- **后端 `hidden` → `meta.hideInMenu`**：`access.ts` 将后端的 `hidden` 字段映射到 Vue Router 的 `meta.hideInMenu`，确保侧边栏正确隐藏菜单项。
- **路由名称去重**：`fixRouteNameConflictsForVueRouter` 在后端菜单名称重复时自动生成唯一名称。不要依赖后端提供的名称具有唯一性。
