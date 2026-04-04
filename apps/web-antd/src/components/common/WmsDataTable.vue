<template>
  <div class="wms-data-table">
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="rowKey"
      :row-selection="rowSelection"
      @change="handleTableChange"
    >
      <template #bodyCell="slotProps">
        <slot name="bodyCell" v-bind="slotProps" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Table as ATable } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue/es/table';
import type { Key } from 'ant-design-vue/es/table/interface';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showTotal?: boolean;
}

interface Props {
  columns: any[];
  dataSource: any[];
  loading?: boolean;
  pagination?: PaginationProps;
  rowKey?: string;
  enableSelection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: undefined,
  rowKey: 'id',
  enableSelection: false,
});

const emit = defineEmits<{
  (e: 'pageChange', payload: { page: number; pageSize: number }): void;
  (e: 'selectionChange', selectedRowKeys: Key[]): void;
}>();

const paginationConfig = computed<false | TablePaginationConfig>(() => {
  if (!props.pagination) return false;
  return {
    current: props.pagination.current,
    pageSize: props.pagination.pageSize,
    total: props.pagination.total,
    showSizeChanger: props.pagination.showSizeChanger ?? true,
    showTotal: props.pagination.showTotal
      ? (total: number) => `共 ${total} 条`
      : undefined,
  };
});

const rowSelection = computed(() => {
  if (!props.enableSelection) return undefined;
  return {
    type: 'checkbox' as const,
    onChange: (selectedRowKeys: Key[]) => {
      emit('selectionChange', selectedRowKeys);
    },
  };
});

function handleTableChange(
  pag: TablePaginationConfig,
) {
  if (!props.pagination || !pag.current || !pag.pageSize) return;
  emit('pageChange', {
    page: pag.current,
    pageSize: pag.pageSize,
  });
}
</script>

<style scoped>
.wms-data-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}
</style>
