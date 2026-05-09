<template>
  <Card :bordered="false" class="wms-data-table-card">
    <!-- 工具栏区域 -->
    <div class="wms-data-table-toolbar">
      <slot name="toolbar">
        <Space wrap>
          <slot name="batch-actions" />
        </Space>
      </slot>
    </div>

    <!-- 表格主体 -->
    <Table
      v-bind="tableAttrs"
      :row-key="rowKey"
      :loading="loading"
      :columns="columns"
      :data-source="dataSource"
      :pagination="paginationConfig"
      :row-selection="computedRowSelection"
      :scroll="scroll"
      :expanded-row-keys="expandedRowKeys"
      @change="handleTableChange"
      @expand="onExpand"
    >
      <!-- 透传普通插槽 -->
      <template v-for="(_, name) in slots" #[name]="slotData: any" :key="name">
        <slot :name="name" v-bind="slotData" />
      </template>

      <!-- 透传 bodyCell 作用域插槽 -->
      <template v-if="slots.bodyCell" #bodyCell="slotData">
        <slot name="bodyCell" v-bind="slotData" />
      </template>
    </Table>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';
import { Button, Card, Popconfirm, Space, Table } from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { $t } from '@vben/locales';

interface WmsDataTableProps {
  /** 表格加载状态 */
  loading?: boolean;
  /** 表格列配置 */
  columns: TableColumnsType;
  /** 表格数据源 */
  dataSource: any[];
  /** 行唯一标识字段 */
  rowKey?: string | ((record: any) => string | number);
  /** 分页配置（传 false 禁用分页） */
  pagination?: false | TablePaginationConfig;
  /** 行选择配置 */
  rowSelection?: {
    selectedRowKeys: any[];
    onChange: (keys: any[], rows: any[]) => void;
  };
  /** 滚动配置 */
  scroll?: { x?: number | string; y?: number | string };
  /** 展开的行 keys（用于树形表格） */
  expandedRowKeys?: any[];
  /** 表格变更回调（排序、筛选等） */
  onTableChange?: (pagination: any, filters: any, sorter: any) => void;
  /** 树形节点展开/折叠回调 */
  onExpand?: (expanded: boolean, record: any) => void;
}

const props = withDefaults(defineProps<WmsDataTableProps>(), {
  loading: false,
  rowKey: 'id',
  pagination: undefined,
  expandedRowKeys: () => [],
});

const emit = defineEmits<{
  (e: 'change', pagination: any, filters: any, sorter: any): void;
  (e: 'table-change', pagination: any, filters: any, sorter: any): void;
  (e: 'update:rowSelection', val: { keys: any[]; rows: any[] }): void;
  (e: 'expand', expanded: boolean, record: any): void;
}>();

const attrs = useAttrs();
const slots = defineSlots();

const selectedRowKeys = ref<any[]>([]);

// 同步外部 rowSelection 的 selectedRowKeys
watch(
  () => props.rowSelection?.selectedRowKeys,
  (keys) => {
    if (keys) selectedRowKeys.value = [...keys];
  },
  { immediate: true },
);

const computedRowSelection = computed(() => {
  if (!props.rowSelection) return undefined;
  return {
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: any[], rows: any[]) => {
      selectedRowKeys.value = [...keys];
      props.rowSelection?.onChange(keys, rows);
      emit('update:rowSelection', { keys, rows });
    },
  };
});

const tableAttrs = computed(() => {
  const next = { ...attrs } as Record<string, any>;
  // 避免父层 @change 透传到 antd Table，与本组件内部 @change 合并后变成非函数
  delete next.onChange;
  return next;
});

// 内部分页配置（避免直接修改 props.pagination）
const paginationConfig = computed(() => {
  if (props.pagination === false) return false;
  if (!props.pagination) return false;
  return {
    showSizeChanger: true,
    showTotal: (total: number) => $t('wms.table.totalRecords', { total }),
    ...props.pagination,
  };
});

function handleTableChange(pagination: any, filters: any, sorter: any) {
  emit('change', pagination, filters, sorter);
  emit('table-change', pagination, filters, sorter);
  props.onTableChange?.(pagination, filters, sorter);
}

function onExpand(expanded: boolean, record: any) {
  emit('expand', expanded, record);
  props.onExpand?.(expanded, record);
}
</script>

<style scoped>
.wms-data-table-card :deep(.ant-card-body) {
  padding: 0 16px 16px 16px;
}

.wms-data-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
