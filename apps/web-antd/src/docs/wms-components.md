# WMS 公共组件使用说明

## 组件清单

### 1. WmsPageLayout
统一页面骨架，负责：
- 页面标题 / 描述
- 右上角操作区
- 统计区 / 筛选区 / 表格区分段布局

```vue
<WmsPageLayout
  title="WMS0020 供应商管理"
  description="管理供应商基本信息、联系方式等"
  :actions="[{ label: '新建供应商', type: 'primary', icon: Plus, onClick: handleAdd }]"
>
  <template #stats>...</template>
  <template #filter>...</template>
  <template #table>
    <WmsDataTable ... />
  </template>
</WmsPageLayout>
```

### 2. WmsStatsCards
统一统计卡片。

```ts
const statsCards = computed(() => [
  { key: 'total', label: '供应商总数', icon: Truck, color: '#2563eb', value: pagination.total || 0 },
  { key: 'enabled', label: '已启用', icon: Power, color: '#16a34a', value: enabledCount.value },
]);
```

```vue
<WmsStatsCards :stats="statsCards" />
```

### 3. WmsFilterBar
统一筛选栏，内置：
- 关键字搜索
- 状态下拉
- 动态筛选标签
- localStorage 持久化
- 右侧扩展按钮区

```vue
<WmsFilterBar
  :query="queryForm as any"
  search-key="supplierName"
  search-placeholder="搜索供应商名称..."
  status-key="isEnabled"
  :status-options="statusFilterOptions"
  :fields="allFieldDefs"
  storage-key="supplier_filter_fields"
  :default-field-keys="['supplierCode', 'supplierName']"
  @search="handleSearch"
>
  <template #actions>
    <Button @click="handleExport">导出</Button>
  </template>
</WmsFilterBar>
```

字段定义：

```ts
const allFieldDefs = [
  { key: 'supplierCode', label: '供应商编码', type: 'input' },
  { key: 'contactPerson', label: '联系人', type: 'input' },
  {
    key: 'warehouseId',
    label: '所属仓库',
    type: 'select',
    options: warehouseOptions.value,
  },
];
```

### 4. WmsDataTable
统一表格容器，封装 Card + Table + Toolbar。

```vue
<WmsDataTable
  row-key="id"
  :loading="loading"
  :columns="columns"
  :data-source="tableData"
  :pagination="pagination"
  :row-selection="rowSelection"
  :scroll="{ x: 1200 }"
  @change="handleTableChange"
>
  <template #toolbar>...</template>
  <template #bodyCell="{ column, record }">...</template>
</WmsDataTable>
```

## 已完成样板
- `src/views/sys/supplier/index.vue`

## 推荐后续迁移方式
1. 保留原页面 `script setup` 中的数据请求和业务逻辑。
2. 优先替换模板层：Header / Stats / Filter / Table。
3. 删除重复样式，统一交给公共组件处理。
4. 每迁移完一个页面执行一次构建或最少执行一次全量构建。

## 本次验证
- 构建命令：`pnpm -C apps/web-antd build`
- 结果：通过
