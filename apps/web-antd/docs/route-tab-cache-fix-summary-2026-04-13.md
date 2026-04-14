# 路由标签切换刷新问题修复总结（2026-04-13）

## 背景
- 现象：切换顶部标签页（tab）时，页面会重新请求数据，导致列表状态丢失。
- 目标：点击 tab 只切换视图，不触发页面重建和初始化请求。

## 官方机制（Vben）
- `meta.keepAlive: true`：开启页面缓存，tab 切换时不重载页面。
- `meta.fullPathKey: false`：tab key 使用 `path`，避免 query/hash 变化导致被识别为新 tab。
- 官方文档：<https://doc.vben.pro/en/guide/essentials/route.html>

## 本次已完成改动

### 1) 浏览器刷新后保持当前页，不再强制跳默认首页
- 文件：`apps/web-antd/src/router/guard.ts`
- 关键点：
  - 动态路由生成完成后，优先 `resolve(to.fullPath)`。
  - 若当前目标路由可解析，直接回到当前目标，而不是跳 first menu。

### 2) 后端动态路由链路强制注入缓存策略（核心）
- 文件：`apps/web-antd/src/router/access.ts`
- 新增逻辑：
  - `normalizePath / resolveRoutePath`：统一解析完整路由路径。
  - `shouldForceKeepAlive`：按“路径 + 路由名 + 组件路径”三重兜底强制启用缓存策略（兼容后端 path 不规范）。
  - `applyRouteMetaPolicies`：在“接口菜单”和“本地缓存菜单”两条链路都注入：
    - `meta.keepAlive = true`
    - `meta.fullPathKey = false`
- 当前强制路径：
  - `基础设置`：`/sys/**`
  - `系统设置`：`/system/**`
  - 兼容后端“绝对子路径”写法：`/user`、`/role`、`/dept`、`/menu`、`/permission`、`/log/**`、`/lowcode/**` 等

### 3) 静态路由对齐（辅助）
- 文件：`apps/web-antd/src/router/routes/modules/sys.ts`
- `仓库档案`、`物料管理` 对齐为：
  - `keepAlive: true`
  - `fullPathKey: false`

### 4) 表元数据下拉接口去重与缓存（针对你反馈的高频请求）
- 文件：`apps/web-antd/src/api/system/columnMeta.ts`
- 现象接口：`GET /api/system/meta/table?pageNum=1&pageSize=1000`
- 处理方式：
  - 增加模块级缓存 `tableMetaSelectCache`
  - 增加并发去重 `tableMetaSelectLoading`
  - 默认命中缓存不再重复请求；支持 `forceRefresh = true` 手动刷新

## 当前验证结果
- `基础设置` 模块：已生效（切 tab 不再触发重载请求）。
- `系统设置` 模块：已补充兼容规则，等待最新一轮实测确认。

## 为什么会出现“基础设置好了，系统设置还不行”
- 项目使用后端动态菜单（`accessMode: backend`），最终生效路由可能与静态文件不一致。
- 后端有时返回“绝对子路径”子菜单（如 `/user`），导致仅按 `/system/...` 精确路径匹配会漏掉。
- 结果：命中不到 `shouldForceKeepAlive`，会继续按默认行为刷新。

## 下一步排查建议（按优先级）
1. 在浏览器中记录“系统设置里会刷新的页面”的实际 URL 路径（例如 `/system/user`、`/system/role`）。
2. 对照 `router.getRoutes()` 查看这些页面的最终 `meta.keepAlive` 是否为 `true`。
3. 把这些真实路径加入 `shouldForceKeepAlive` 白名单，或改成按模块前缀（如 `/system/`）统一策略。

## 备注
- 本次没有使用 `domCached`。该字段在当前项目路由类型定义中不生效。
- 本次改动优先保证“最小范围可控生效”，避免一次性放开全局缓存引入副作用。
