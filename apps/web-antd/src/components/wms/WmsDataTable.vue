<template>
  <Card :bordered="false" class="wms-data-table">
    <div v-if="$slots.toolbar" class="wms-data-table__toolbar">
      <slot name="toolbar" />
    </div>

    <Table
      :row-key="rowKey"
      :loading="loading"
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :row-selection="rowSelection"
      :scroll="scroll"
      @change="(page, filters, sorter, extra) => emit('change', page, filters, sorter, extra)"
    >
      <template #bodyCell="slotProps">
        <slot name="bodyCell" v-bind="slotProps">
          <span>{{ slotProps.text ?? '-' }}</span>
        </slot>
      </template>
    </Table>
  </Card>
</template>

<script setup lang="ts">
import { Card, Table } from 'ant-design-vue';

withDefaults(
  defineProps<{
    rowKey: string | ((record: Record<string, any>) => string | number);
    loading?: boolean;
    columns: any[];
    dataSource: any[];
    pagination?: Record<string, any>;
    rowSelection?: Record<string, any>;
    scroll?: Record<string, any>;
  }>(),
  {
    loading: false,
    pagination: undefined,
    rowSelection: undefined,
    scroll: undefined,
  }
);

const emit = defineEmits<{
  change: [page: any, filters: any, sorter: any, extra: any];
}>();
</script>

<style scoped>
.wms-data-table :deep(.ant-card-body) {
  padding: 0 16px 16px;
}

.wms-data-table__toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
</style>
