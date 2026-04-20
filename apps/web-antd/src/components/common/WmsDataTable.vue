<template>
  <div class="wms-data-table">
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      :row-key="rowKey"
      :row-selection="rowSelection"
      :scroll="scroll"
      :sticky="sticky"
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
import { computed } from 'vue';
import { Pagination as APagination, Table as ATable } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/table/interface';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showTotal?: ((total: number, range: [number, number]) => string) | ((total: number) => string);
}

interface Props {
  columns: any[];
  dataSource: any[];
  loading?: boolean;
  pagination?: PaginationProps;
  rowKey?: string;
  enableSelection?: boolean;
  selectedRowKeys?: Key[];
  scroll?: { x?: number | string; y?: number | string };
  sticky?: boolean;
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
  (e: 'tableChange', pagination: any, filters: any, sorter: any, extra: any): void;
}>();

const pagination = computed(() => props.pagination);

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
</script>

<style scoped>
.wms-data-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}
</style>
