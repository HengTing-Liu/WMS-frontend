<template>
  <div
    class="wms-data-table"
    :class="{ 'wms-data-table--hide-tree-expand': hideTreeExpandIcon }"
  >
    <!-- 列设置工具栏 -->
    <div v-if="enableColumnDrag" class="wms-data-table-toolbar mb-3 flex items-center justify-end gap-2">
      <Popover v-model:open="columnSettingsVisible" trigger="click" placement="bottomRight">
        <template #content>
          <div class="wms-column-settings">
            <div class="font-medium mb-2">列设置</div>
            <div class="wms-column-settings-list">
              <div
                v-for="(col, index) in visibleColumnsWithSettings"
                :key="col.key || col.dataIndex"
                class="wms-column-settings-item"
                :data-index="index"
                draggable="true"
                @dragstart="onColumnDragStart($event, index)"
                @dragover.prevent="onColumnDragOver($event, index)"
                @drop="onColumnDrop($event, index)"
                @dragend="onColumnDragEnd"
              >
                <GripVertical class="cursor-move mr-2 text-gray-400 w-4 h-4" />
                <Checkbox
                  v-model:checked="col._visible"
                  @change="onColumnVisibilityChange(col)"
                >
                  {{ col.title }}
                </Checkbox>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between">
              <Button type="link" size="small" @click="onResetColumns">重置默认</Button>
              <Button type="primary" size="small" @click="columnSettingsVisible = false">完成</Button>
            </div>
          </div>
        </template>
        <Button type="text" size="small">
          <template #icon>
            <Settings class="w-4 h-4" />
          </template>
          列设置
        </Button>
      </Popover>
    </div>

    <a-table
      :columns="currentColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      :row-key="rowKeyResolver"
      :row-selection="rowSelection"
      :scroll="scroll"
      :sticky="sticky"
      :expanded-row-keys="expandedRowKeysForTable"
      :expandable="tableExpandable"
      @update:expanded-row-keys="onUpdateExpandedRowKeys"
      @expand="handleExpand"
      @change="handleTableChange"
    >
      <template #bodyCell="slotProps">
        <slot name="bodyCell" v-bind="slotProps" />
      </template>
    </a-table>

    <div v-if="pagination" class="mt-4 flex justify-end">
      <a-pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="pagination.showSizeChanger ?? true"
        :show-total="pagination.showTotal as any"
        @change="handlePageChange"
        @show-size-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { Pagination as APagination, Table as ATable } from 'ant-design-vue';
import { Checkbox, Popover, Button } from 'ant-design-vue';
import { Settings, GripVertical } from 'lucide-vue-next';
import type { Key } from 'ant-design-vue/es/table/interface';
import { useLocalStorage } from '@vueuse/core';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showTotal?: ((total: number, range: [number, number]) => string) | ((total: number) => string);
}

interface ColumnItem {
  title?: string;
  key?: string;
  dataIndex?: string;
  _visible?: boolean;
  _order?: number;
  [key: string]: any;
}

interface Props {
  columns: any[];
  dataSource: any[];
  loading?: boolean;
  pagination?: PaginationProps;
  /** 行主键字段名，或自定义函数（避免字段缺失时全部为 undefined 导致整表渲染成同一行） */
  rowKey?: string | ((record: any) => string | number);
  enableSelection?: boolean;
  selectedRowKeys?: Key[];
  /** 受控展开的行 key（树形表格与 LowcodeTreePage 折叠/展开工具栏） */
  expandedRowKeys?: Key[];
  /** 树形数据时隐藏行首 +/- 展开图标（仍受控 expandedRowKeys，默认保持展开） */
  hideTreeExpandIcon?: boolean;
  scroll?: { x?: number | string; y?: number | string };
  sticky?: boolean;
  /** 启用列拖拽排序功能 */
  enableColumnDrag?: boolean;
  /** 列配置存储的 key（用于区分不同页面的列配置） */
  columnSettingsKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: undefined,
  rowKey: 'id',
  enableSelection: false,
  hideTreeExpandIcon: false,
  enableColumnDrag: true,
  columnSettingsKey: 'default-columns',
});

const emit = defineEmits<{
  (e: 'pageChange', payload: { page: number; pageSize: number }): void;
  (e: 'selectionChange', selectedRowKeys: Key[]): void;
  (e: 'tableChange', pagination: any, filters: any, sorter: any, extra: any): void;
  (e: 'expand', expanded: boolean, record: any): void;
  /** 与 expandedRowKeys 配套，Ant Design Vue Table 受控展开必需 */
  (e: 'update:expandedRowKeys', keys: Key[]): void;
  /** 列配置变更时触发 */
  (e: 'columnsChange', columns: any[]): void;
}>();

// ==================== 列设置状态 ====================
const columnSettingsVisible = ref(false);
const dragSourceIndex = ref<number | null>(null);
const dragTargetIndex = ref<number | null>(null);

// 使用 vueuse 的 useLocalStorage 持久化列配置
const storedColumnSettings = useLocalStorage<{
  order: string[];
  visibility: Record<string, boolean>;
} | null>(`wms-table-columns-${props.columnSettingsKey}`, null);

// 初始化列配置（添加内部使用的 _visible 和 _order 属性）
function initColumnSettings() {
  const settings = storedColumnSettings.value;
  const defaultOrder: string[] = [];
  const defaultVisibility: Record<string, boolean> = {};

  // 初始化默认配置
  props.columns.forEach((col, index) => {
    const key = col.key || col.dataIndex;
    if (key) {
      defaultOrder[index] = key;
      defaultVisibility[key] = true;
    }
  });

  // 如果有存储的配置，则使用存储的配置
  if (settings) {
    const order = settings.order || defaultOrder;
    const visibility = settings.visibility || defaultVisibility;

    return {
      order,
      visibility,
      columns: props.columns.map((col) => {
        const key = col.key || col.dataIndex;
        return {
          ...col,
          _visible: visibility[key] !== false,
          _order: order.indexOf(key),
        };
      }),
    };
  }

  // 默认配置
  return {
    order: defaultOrder,
    visibility: defaultVisibility,
    columns: props.columns.map((col, index) => ({
      ...col,
      _visible: true,
      _order: index,
    })),
  };
}

const columnSettingsState = ref(initColumnSettings());

// 监听 columns prop 变化，重新初始化（当页面切换时）
watch(
  () => props.columns,
  () => {
    columnSettingsState.value = initColumnSettings();
  },
  { deep: true }
);

// 当前使用的列配置（已排序且已过滤隐藏列）
const currentColumns = computed(() => {
  const cols = [...columnSettingsState.value.columns];
  // 按 _order 排序
  cols.sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
  // 过滤隐藏的列
  return cols.filter((col) => col._visible !== false);
});

// 用于设置面板显示的列（带所有配置）
const visibleColumnsWithSettings = computed(() => {
  return [...columnSettingsState.value.columns].sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
});

// 保存列配置到 localStorage
function saveColumnSettings() {
  const order: string[] = [];
  const visibility: Record<string, boolean> = {};

  columnSettingsState.value.columns.forEach((col) => {
    const key = col.key || col.dataIndex;
    if (key) {
      order.push(key);
      visibility[key] = col._visible !== false;
    }
  });

  storedColumnSettings.value = { order, visibility };
  emit('columnsChange', currentColumns.value);
}

// 重置为默认配置
function onResetColumns() {
  storedColumnSettings.value = null;
  columnSettingsState.value = initColumnSettings();
  emit('columnsChange', currentColumns.value);
}

// 列可见性变更
function onColumnVisibilityChange(col: ColumnItem) {
  saveColumnSettings();
}

// ==================== 拖拽排序 ====================
function onColumnDragStart(event: DragEvent, index: number) {
  dragSourceIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onColumnDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  dragTargetIndex.value = index;
}

function onColumnDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault();
  if (dragSourceIndex.value === null || dragSourceIndex.value === targetIndex) {
    return;
  }

  const cols = columnSettingsState.value.columns;
  const sourceCol = cols[dragSourceIndex.value];

  // 更新 _order
  cols.forEach((col, idx) => {
    if (idx === dragSourceIndex.value) {
      col._order = targetIndex;
    } else if (
      dragSourceIndex.value < targetIndex &&
      idx > dragSourceIndex.value &&
      idx <= targetIndex
    ) {
      col._order = idx - 1;
    } else if (
      dragSourceIndex.value > targetIndex &&
      idx >= targetIndex &&
      idx < dragSourceIndex.value
    ) {
      col._order = idx + 1;
    }
  });

  saveColumnSettings();
}

function onColumnDragEnd() {
  dragSourceIndex.value = null;
  dragTargetIndex.value = null;
}

const pagination = computed(() => props.pagination);

/** Ant Table rowKey：字符串字段或函数；字符串时兼容 snake_case 与常见备用主键 */
const rowKeyResolver = computed(() => {
  const rk = props.rowKey ?? 'id';
  if (typeof rk === 'function') {
    return rk;
  }
  const field = rk;
  return (record: any) => {
    if (!record || typeof record !== 'object') {
      return '';
    }
    const direct = record[field];
    if (direct !== undefined && direct !== null && direct !== '') {
      return direct;
    }
    const snake = field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    const snakeVal = record[snake];
    if (snakeVal !== undefined && snakeVal !== null && snakeVal !== '') {
      return snakeVal;
    }
    const camel = field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    const camelVal = record[camel];
    if (camelVal !== undefined && camelVal !== null && camelVal !== '') {
      return camelVal;
    }
    const id = record.userId ?? record.user_id ?? record.id ?? record.dept_id ?? record.deptId;
    if (id !== undefined && id !== null && id !== '') {
      return id;
    }
    const code = record.dept_code ?? record.deptCode;
    if (code !== undefined && code !== null && code !== '') {
      return String(code);
    }
    return '';
  };
});

/** 隐藏树形行首展开图标时，用空节点占位（兼容不同 ant-design-vue 版本，样式在 scoped 中补强） */
const tableExpandable = computed(() => {
  if (!props.hideTreeExpandIcon) {
    return undefined;
  }
  return {
    expandIcon: () =>
      h('span', {
        class: 'wms-data-table-tree-expand-placeholder',
        style: {
          display: 'inline-block',
          width: 0,
          height: 0,
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          border: 'none',
          verticalAlign: 'middle',
        },
        'aria-hidden': true,
      }),
    /** 子级行不再预留层级缩进，避免「部门编码」等首列文字被挤换行 */
    indentSize: 0,
  };
});

/** 未传 expandedRowKeys 时不绑定，避免把表格锁成「始终空展开」的受控模式 */
const expandedRowKeysForTable = computed(() =>
  props.expandedRowKeys !== undefined ? props.expandedRowKeys : undefined,
);

function onUpdateExpandedRowKeys(keys: Key[]) {
  if (props.expandedRowKeys !== undefined) {
    emit('update:expandedRowKeys', keys);
  }
}

const rowSelection = computed(() => {
  if (!props.enableSelection) return undefined;
  return {
    type: 'checkbox' as const,
    selectedRowKeys: props.selectedRowKeys ?? [],
    onChange: (selectedRowKeys: Key[]) => {
      emit('selectionChange', selectedRowKeys);
    },
  };
});

function handlePageChange(page: number, pageSize: number) {
  emit('pageChange', { page, pageSize });
}

function handleTableChange(pagination: any, filters: any, sorter: any, extra: any) {
  emit('tableChange', pagination, filters, sorter, extra);
}

function handleExpand(expanded: boolean, record: any) {
  emit('expand', expanded, record);
}
</script>

<style scoped>
.wms-data-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

/* 树形表：仅在 hideTreeExpandIcon 时隐藏行首 +/- */
.wms-data-table--hide-tree-expand:deep(.ant-table-row-expand-icon),
.wms-data-table--hide-tree-expand:deep(.ant-table-row-expand-icon-collapsed),
.wms-data-table--hide-tree-expand:deep(.ant-table-row-expand-icon-expanded) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  pointer-events: none;
}

/* 清除树层级缩进（antd 4.x 常用 .ant-table-row-indent，5.x 可能为 .ant-table-cell-indent） */
.wms-data-table--hide-tree-expand:deep(.ant-table-row-indent),
.wms-data-table--hide-tree-expand:deep(span.ant-table-row-indent) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  padding-left: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.wms-data-table--hide-tree-expand:deep(.ant-table-cell-indent),
.wms-data-table--hide-tree-expand:deep([class*='ant-table-cell-indent']) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 首列带 append 区域时，去掉多余左内边距，与其它列对齐 */
.wms-data-table--hide-tree-expand:deep(.ant-table-cell-with-append) {
  padding-left: 16px !important;
}

/* 列设置面板 */
.wms-column-settings {
  width: 240px;
}

.wms-column-settings-list {
  max-height: 300px;
  overflow-y: auto;
}

.wms-column-settings-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: default;
  transition: background-color 0.2s;
}

.wms-column-settings-item:hover {
  background-color: #f5f5f5;
}

.wms-column-settings-item.dragging {
  opacity: 0.5;
  background-color: #e6f7ff;
}

.wms-column-settings-item.drag-over {
  border-top: 2px solid #1890ff;
}
</style>
