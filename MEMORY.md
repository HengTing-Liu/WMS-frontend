# 前端团队共享记忆库

## SVN 仓库信息

- **SVN地址**: `https://iZm54avhr1cbkoZ:8443/svn/wmsprojects/`
- **前端路径**: `https://iZm54avhr1cbkoZ:8443/svn/wmsprojects/wmscode/frontend`
- **用户名**: xiaolongxia
- **密码**: xiaolongxia

## 代码位置

- **前端**: `/home/kftd/.openclaw/workspace-frontend/wms-vue`
- **后端**: `/home/kftd/.openclaw/workspace/projects/backend/`
- **文档**: `/home/kftd/.openclaw/workspace/projects/docs/`

## 项目信息

- **项目名称**: WMS (仓库管理系统)
- **前端框架**: Vue 3 + Vben Admin 5.5.9
- **包管理器**: pnpm 10.28.2+
- **构建工具**: Turbo + Vite
- **Node版本**: >=20.19.0 (当前使用 v22.22.1)

## 已修复的问题

1. **pnpm-workspace.yaml 循环依赖**
   - 问题: `playwright: 'catalog:'` 自引用
   - 修复: 改为 `playwright: ^1.58.2`

2. **环境变量缺失 VITE_APP_TITLE**
   - 问题: 编译时提示 `VITE_APP_TITLE is not defined`
   - 修复: 添加到 `.env.production` 和 `.env.development`
   - 值: `WMS管理系统`

3. **API导出缺失**
   - 文件: `apps/web-antd/src/api/sys/permission.ts`
   - 缺失: `getPermissionList()`, `getPermissionDetail()`
   - 修复: 添加这两个导出函数

## 编译成功

- ✅ 所有12个任务编译成功
- ✅ 生成 dist.zip (1.76MB)
- ✅ 编译时间 ~20s

## 分工建议

**推荐方案：并行分工**
- **AI**: 负责排查和修复bug + 环境配置问题
- **人类**: 负责新功能开发
- 原因: 避免同时修改同一文件导致冲突

## 开发规范 (来自 docs/00-开发规范.md)

### 每日工作流程
```bash
# 1) 更新代码
svn update --username xiaolongxia --password xiaolongxia --trust-server-cert

# 2) 开发/修复

# 3) 自检
pnpm build

# 4) 提交
svn add .
svn commit --username xiaolongxia --password xiaolongxia --trust-server-cert -m "说明"
```

### 角色职责
- **前端开发**: 新功能页面开发
- **前端Bug修复**: 修复前端Bug (我)
- **后端开发**: 新功能API开发
- **后端Bug修复**: 修复后端Bug
- **代码审查**: 审查代码质量 (评分≥80%通过)
- **测试**: 功能测试

### 禁止事项
- ❌ 前端Bug修复角色不能写新功能
- ❌ 前端角色不能写后端代码
- ❌ Reviewer不能修改代码

### 开发流程
```
需求 → PM分配 → 开发自检 → 提交SVN → Review审核 → 测试 → 验收
```

### 常见问题
- SVN连接失败 → 添加 `--trust-server-cert`
- 提交被拒绝 → 先 `svn update`
- 编译失败 → 删除 node_modules 重新构建

## 团队代码下载状态

### Team 空间代码位置
- **Frontend2 (我的工作目录)**: `/home/kftd/.openclaw/workspace/team/frontend2`
- **Frontend**: `/home/kftd/.openclaw/workspace/team/frontend`
- **Projects-Frontend**: `/home/kftd/.openclaw/workspace/projects/frontend`

### 下载情况
- ✅ **team/frontend2**: 已下载 (SVN版本: r10)
- ✅ **依赖已安装**: pnpm install 完成
- ✅ **配置已同步**: 包含修复后的 .env 文件

### 每日提醒

**重启时检查清单**:
- [ ] 阅读开发规范 (docs/00-开发规范.md)
- [ ] 检查SVN更新 (svn update)
- [ ] 查看记忆文件 (MEMORY.md)
- [ ] 确认项目编译通过 (pnpm build)

**每日工作流程**:
1. 更新代码: `svn update --username xiaolongxia --password xiaolongxia --trust-server-cert`
2. 查看需求文档
3. 开发/修复bug
4. 自检: `pnpm build`
5. 提交: `svn add . && svn commit -m "说明"`

## 待更新

- [x] 阅读开发规范文档 (docs/00-开发规范.md)
- [x] 根据规范更新记忆文件
- [x] 下载团队共享代码
- [x] 安装项目依赖
