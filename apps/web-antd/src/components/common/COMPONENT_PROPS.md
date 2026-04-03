# 公共组件 Props / Emit / Slot 文档

## WmsSearchBar

通用搜索栏组件，支持静态字段配置、远程字段加载、字段显示记忆缓存。

### Props

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `fields` | `SearchField[]` | 否 | `[]` | 静态字段配置数组 |
| `remoteFieldsUrl` | `string` | 否 | `''` | 远程字段接口 URL，GET 请求，返回 `SearchField[]` |
| `cacheKey` | `string` | 否 | `''` | localStorage 缓存 key，用于记忆用户勾选的显示字段 |
| `modelValue` | `Record<string, any>` | 否 | `{}` | 当前搜索表单对象，支持 `v-model` |

#### SearchField 类型

```ts
interface SearchField {
  key: string;
  label: string;
  /** 字段类型 */
  type: 'input' | 'select' | 'switch' | 'treeSelect' | 'dateRange' | 'numberRange';
  options?: { label: string; value: string | number }[];

  // ---- treeSelect 专用 ----
  /** 本地树形数据（优先于 treeUrl） */
  treeData?: TreeNode[];
  /** 懒加载树数据接口 URL */
  treeUrl?: string;
  /** 树节点字段映射，默认 { label:'title', value:'value', children:'children' } */
  treeFieldNames?: { label: string; value: string; children: string };
  /** 是否多选，默认 false */
  treeMultiple?: boolean;

  // ---- dateRange 专用 ----
  /** 日期格式，默认 'YYYY-MM-DD' */
  dateFormat?: string;
  /** 是否显示时间，默认 false */
  showTime?: boolean;

  // ---- numberRange 专用 ----
  /** 占位提示，格式 "最小值 ~ 最大值" */

  placeholder?: string;
}

interface TreeNode {
  title: string;
  value: string | number;
  children?: TreeNode[];
  [key: string]: any;
}
```

#### 字段类型说明

| type | 组件 | 渲染方式 | 后端 formType |
|------|------|---------|--------------|
| `input` | AInput | 单行文本 | text / input |
| `select` | ASelect | 下拉 | select / radio |
| `switch` | ASwitch | 开关 | switch |
| `treeSelect` | ATreeSelect | 树形下拉，支持懒加载 | treeSelect |
| `dateRange` | ARangePicker | 日期范围选择 | dateRange |
| `numberRange` | 两个 AInputNumber 并排 | 数字范围（生成 `{key}Min` + `{key}Max` 两个查询参数） | numberRange |

### Emit

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `Record<string, any>` | 表单值变化时触发（用于 `v-model`） |
| `search` | `Record<string, any>` | 点击搜索按钮时触发，携带当前表单值 |
| `reset` | - | 点击重置按钮时触发，同时清空表单值 |

### 暴露的方法（通过 ref 调用）

| 方法 | 参数 | 说明 |
|------|------|------|
| `updateFieldOptions(key, options)` | key: 字段名, options: 下拉选项 | 动态更新下拉选项（如从父组件注入） |
| `updateFieldTreeData(key, treeData)` | key: 字段名, treeData: 树形数据 | 动态更新 treeSelect 数据 |

---

## WmsDataTable

通用数据表格 + 分页组件，基于 Ant Design Vue Table 封装。

### Props

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `columns` | `any[]` | 是 | - | 表格列配置，与 Ant Design Table `columns` 格式一致 |
| `dataSource` | `any[]` | 是 | - | 数据源数组 |
| `loading` | `boolean` | 否 | `false` | 表格加载状态 |
| `pagination` | `{ current, pageSize, total, showSizeChanger?, showTotal? }` | 否 | `undefined` | 分页配置；不传则隐藏分页 |
| `rowKey` | `string` | 否 | `'id'` | 行数据的唯一标识字段名 |
| `enableSelection` | `boolean` | 否 | `false` | 是否开启行复选框选择 |

### Emit

| 事件 | 参数 | 说明 |
|------|------|------|
| `pageChange` | `{ page: number; pageSize: number }` | 分页页码或每页条数变化时触发 |
| `selectionChange` | `Key[]` | 勾选行变化时触发，携带已选行的 `rowKey` 数组 |

### Slot

| 插槽名 | 作用域参数 | 说明 |
|--------|-----------|------|
| `bodyCell` | `{ text, record, index, column }` | 透传给 Ant Design Table 的 `bodyCell` 插槽，用于自定义单元格内容 |
