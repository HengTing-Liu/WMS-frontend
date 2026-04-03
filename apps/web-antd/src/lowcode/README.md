# Lowcode 模块

基于后端 meta 配置的前端低代码页面组件库。

## 目录结构

```
src/lowcode/
├── index.ts              # 统一导出
├── types.ts              # 共享类型定义
├── api.ts                # Meta 接口 + 通用 CRUD 接口
├── FieldRenderer.vue     # 字段渲染器（text/textarea/number/select/switch + 字典加载）
├── LowcodePage.vue       # 标准列表页面（核心组件）
└── LowcodeDrawer.vue     # 表单抽屉（新建/编辑）
```

## 快速开始

### 方式一：使用 LowcodePage（推荐）

新建页面 `views/lowcode/xxx/index.vue`：

```vue
<template>
  <LowcodePage
    table-code="WMS0010"
    page-title="仓库档案"
    crud-prefix="/api/base/warehouse"
    :show-stats="true"
    :stats-config="statsConfig"
  />
</template>

<script setup lang="ts">
import LowcodePage from '#/lowcode/LowcodePage.vue';
import type { StatsCardConfig } from '#/lowcode/types';

const statsConfig: StatsCardConfig[] = [
  { key: 'totalCount', label: '总仓库数', icon: 'material-symbols:warehouse', color: '#1677ff', field: 'totalCount' },
  { key: 'enabledCount', label: '已启用', icon: 'material-symbols:check-circle', color: '#52c41a', field: 'enabledCount' },
];
</script>
```

### 方式二：使用 LowcodeDrawer

```vue
<template>
  <LowcodeDrawer
    v-model:open="drawerVisible"
    table-code="WMS0010"
    :record="currentRecord"
    @success="onFormSuccess"
  />
</template>
```

## 组件

### LowcodePage

标准列表页面，自动渲染：搜索栏 + 数据表格 + 操作按钮 + 新建/编辑抽屉。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tableCode` | `string` | **必填** | 表编码，对应 `sys_table_meta.table_code` |
| `pageTitle` | `string` | - | 页面标题 |
| `pageDesc` | `string` | - | 页面描述 |
| `crudPrefix` | `string` | - | CRUD 接口前缀，默认按约定推断 |
| `showStats` | `boolean` | `false` | 是否显示统计卡片 |
| `statsConfig` | `StatsCardConfig[]` | `[]` | 统计卡片配置 |
| `enableSelection` | `boolean` | `false` | 是否开启行选择 |
| `staticColumns` | `any[]` | `[]` | 静态表格列配置（优先于 meta） |
| `staticOperations` | `LowcodeAction[]` | `[]` | 静态操作按钮（优先于 meta） |

| Event | 参数 | 说明 |
|-------|------|------|
| `search` | `query` | 搜索触发 |
| `create` | - | 新建按钮点击 |
| `edit` | `record` | 编辑按钮点击 |
| `delete` | `id` | 删除成功 |
| `toggle` | `record, enabled` | 启用/停用 |
| `formSuccess` | `record` | 表单保存成功 |

| Method | 说明 |
|--------|------|
| `reload()` | 刷新列表数据 |

### LowcodeDrawer

表单抽屉，支持新建/编辑，表单字段由后端 meta 驱动。

### FieldRenderer

独立字段渲染器，根据 schema 渲染对应表单控件。

**用法**：

```vue
<template>
  <!-- 方式1：直接在表单中使用 -->
  <FieldRenderer :field="fieldSchema" v-model="formModel[fieldName]" />

  <!-- 方式2：接收 schema + value + emit -->
  <FieldRenderer
    :field="fieldSchema"
    :value="formModel[fieldName]"
    @update="(val) => formModel[fieldName] = val"
  />
</template>

<script setup lang="ts">
import { FieldRenderer } from '#/lowcode';

// 字段类型说明：
// - text      → AInput（单行文本）
// - textarea  → AInput.TextArea（多行文本）
// - number    → AInputNumber（数字）
// - select    → ASelect（下拉，支持 dictType 加载字典）
// - switch    → ASwitch（开关，输出 1/0）
</script>
```

**FieldSchema 属性**：

| Prop | 类型 | 说明 |
|------|------|------|
| `field` / `code` | `string` | 字段编码 |
| `label` / `title` | `string` | 字段标题 |
| `fieldType` / `dataType` / `formType` | `string` | 字段类型（text/textarea/number/select/switch） |
| `dictType` | `string` | 字典编码，从 sys_dict 加载下拉选项 |
| `options` / `dataSource` | `Option[]` | 静态下拉选项 |
| `defaultValue` | `any` | 默认值 |
| `placeholder` | `string` | 占位符 |
| `disabled` | `boolean` | 是否禁用 |

| Event | 参数 | 说明 |
|-------|------|------|
| `update` | `value` | 值变化（自动类型转换后） |
| `change` | `value` | 同 update |

> FieldRenderer 是 LowcodeDrawer 内部渲染逻辑的独立封装。当 LowcodeDrawer 复用 DynamicFormDefinitionPage.vue 时使用后者；当需要轻量化独立渲染时使用 FieldRenderer。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | **必填** | 抽屉是否打开（`v-model:open`） |
| `tableCode` | `string` | **必填** | 表编码 |
| `record` | `Record<string, any>` | `null` | 当前编辑记录（`null` = 新增） |
| `width` | `number \| string` | `600` | 抽屉宽度 |
| `readonly` | `boolean` | `false` | 只读模式 |
| `formDefinitionUrl` | `string` | - | 表单定义接口路径 |
| `submitUrl` | `string` | - | 提交接口路径 |

| Event | 参数 | 说明 |
|-------|------|------|
| `success` | `record` | 保存成功 |
| `error` | `err` | 保存失败 |
| `close` | - | 抽屉关闭 |

| Method | 说明 |
|--------|------|
| `submit()` | 主动触发保存 |
| `reset()` | 重置表单 |

## 后端接口约定

### Meta 接口（复用现有）

```
GET  /api/system/meta/column/schema?tableCode={code}  → 获取字段 Schema
GET  /api/system/meta/table/{code}                 → 获取表元数据
GET  /api/system/meta/operation/list/{code}         → 获取操作按钮
```

### CRUD 接口（需后端实现通用接口）

```
GET    /api/{module}/{entity}/list    → 列表查询
GET    /api/{module}/{entity}/{id}    → 详情
POST   /api/{module}/{entity}         → 新增
PUT    /api/{module}/{entity}/{id}    → 修改
DELETE /api/{module}/{entity}/{id}     → 删除
PUT    /api/{module}/{entity}/{id}/toggle  → 启用/停用
```

## 新增一个档案页面

**Step 1：后端配置**（约 10 分钟）

在 `sys_table_meta`、`sys_column_meta`、`sys_table_operation` 表插入配置数据。

**Step 2：前端新建页面**（约 5 分钟）

在 `views/lowcode/` 下新建目录，编写 `index.vue`，引用 `LowcodePage` 组件。

**Step 3：配置路由**（约 1 分钟）

在路由配置中添加页面路由。

完成，三步即可上线一个新页面。

## 适用场景

- ✅ **A 类页面**：纯档案页面（仓库档案、物料档案、质检标准等）
- ✅ **B 类页面**：简单单据（需扩展 LowcodeDrawer）
- ❌ **C 类页面**：复杂业务单据（多行明细、状态机）暂不适合，建议定制开发
