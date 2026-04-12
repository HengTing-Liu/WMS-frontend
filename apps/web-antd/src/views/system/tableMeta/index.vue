<template>
  <WmsPageLayout title="Table Meta" description="Manage lowcode table meta config">
    <template #filter>
      <Card :bordered="false">
        <Space wrap>
          <Input
            v-model:value="queryForm.tableCode"
            placeholder="Table code"
            allow-clear
            style="width: 220px"
            @press-enter="handleSearch"
          />
          <Input
            v-model:value="queryForm.tableName"
            placeholder="Table name"
            allow-clear
            style="width: 220px"
            @press-enter="handleSearch"
          />
          <Select
            v-model:value="queryForm.module"
            placeholder="Module"
            allow-clear
            style="width: 180px"
          >
            <SelectOption value="base">base</SelectOption>
            <SelectOption value="wms">wms</SelectOption>
            <SelectOption value="sys">sys</SelectOption>
          </Select>
          <Button type="primary" @click="handleSearch">Search</Button>
          <Button @click="handleReset">Reset</Button>
        </Space>
      </Card>
    </template>

    <template #actions>
      <Button type="primary" :loading="exporting" @click="handleExport">
        <template #icon><Download /></template>
        Export
      </Button>
      <Button type="primary" @click="handleAdd">
        <template #icon><Plus /></template>
        Create
      </Button>
    </template>

    <WmsDataTable
      ref="tableRef"
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isTree'">
          {{ record.isTree === 1 ? 'Yes' : 'No' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="record.status === 1"
            @change="(checked: boolean) => handleToggleStatus(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">Edit</Button>
            <Popconfirm
              title="Delete this record?"
              ok-text="OK"
              cancel-text="Cancel"
              @confirm="handleDelete(record)"
            >
              <Button type="link" size="small" danger>Delete</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </WmsDataTable>

    <TableMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Button, Card, Input, Popconfirm, Select, SelectOption, Space, Switch, message } from 'ant-design-vue';
import { Download, Plus } from 'lucide-vue-next';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import {
  deleteTableMeta,
  exportTableMeta,
  getTableMetaList,
  toggleTableMetaStatus,
  type TableMetaQuery,
  type TableMetaResult,
} from '#/api/system/tableMeta';
import TableMetaModal from './modules/table-meta-modal.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<TableMetaResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const tableRef = ref();

const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<TableMetaResult | null>(null);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `Total ${total}`,
});

const queryForm = reactive<TableMetaQuery>({
  tableCode: '',
  tableName: '',
  module: '',
});

const columns = computed<TableColumnsType<TableMetaResult>>(() => [
  {
    title: 'No.',
    key: 'index',
    width: 70,
    customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}`,
  },
  { title: 'Table Code', dataIndex: 'tableCode', key: 'tableCode', width: 150 },
  { title: 'Table Name', dataIndex: 'tableName', key: 'tableName', width: 180 },
  { title: 'Module', dataIndex: 'module', key: 'module', width: 100 },
  { title: 'Entity Class', dataIndex: 'entityClass', key: 'entityClass', width: 220, ellipsis: true },
  { title: 'Service Class', dataIndex: 'serviceClass', key: 'serviceClass', width: 240, ellipsis: true },
  { title: 'Permission', dataIndex: 'permissionCode', key: 'permissionCode', width: 180 },
  { title: 'Page Size', dataIndex: 'pageSize', key: 'pageSize', width: 110, align: 'center' },
  { title: 'Tree', key: 'isTree', width: 80, align: 'center' },
  { title: 'Status', key: 'status', width: 80, align: 'center' },
  { title: 'Remark', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
  { title: 'Create Time', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: 'Action', key: 'action', width: 140, fixed: 'right' },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    tableCode: queryForm.tableCode?.trim() || undefined,
    tableName: queryForm.tableName?.trim() || undefined,
    module: queryForm.module || undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getTableMetaList({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res?.rows || [];
    pagination.total = res?.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || 'Load table meta failed');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleReset() {
  queryForm.tableCode = '';
  queryForm.tableName = '';
  queryForm.module = '';
  selectedRowKeys.value = [];
  pagination.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  modalMode.value = 'add';
  currentRecord.value = null;
  modalVisible.value = true;
}

function handleEdit(record: TableMetaResult) {
  modalMode.value = 'edit';
  currentRecord.value = record;
  modalVisible.value = true;
}

async function handleDelete(record: TableMetaResult) {
  if (!record.id) return;
  try {
    await deleteTableMeta(record.id);
    message.success('Delete success');
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || 'Delete failed');
  }
}

async function handleToggleStatus(record: TableMetaResult, checked: boolean) {
  try {
    await toggleTableMetaStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? 'Enable success' : 'Disable success');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || 'Toggle status failed');
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportTableMeta(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table_meta_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('Export success');
  } catch (error: any) {
    message.error(error?.message || 'Export failed');
  } finally {
    exporting.value = false;
  }
}

function handleModalSuccess() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>
