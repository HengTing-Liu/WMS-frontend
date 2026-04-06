<template>
  <WmsPageLayout>
    <template #header>
      <WmsFilterBar
        v-model:fields="filterFields"
        @search="handleSearch"
        @reset="handleReset"
      />
    </template>

    <template #actions>
      <Button type="primary" :loading="exporting" @click="handleExport">
        <template #icon><Download /></template>
        导出
      </Button>
      <Button type="primary" @click="handleAdd">
        <template #icon><Plus /></template>
        新建
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
          {{ record.isTree === 1 ? '是' : '否' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="record.status === 1"
            @change="(checked: boolean) => handleToggleStatus(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">
              编辑
            </Button>
            <Popconfirm
              title="是否确认删除?"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </WmsDataTable>

    <!-- 编辑弹窗 -->
    <TableMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, toRaw } from 'vue';
import { Button, Popconfirm, Space, Switch, message } from 'ant-design-vue';
import { Plus, Download } from 'lucide-vue-next';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { WmsDataTable, WmsFilterBar, WmsPageLayout } from '#/components/wms';
import TableMetaModal from './modules/table-meta-modal.vue';
import {
  getTableMetaList,
  deleteTableMeta,
  toggleTableMetaStatus,
  exportTableMeta,
  type TableMetaResult,
  type TableMetaQuery,
} from '#/api/system/tableMeta';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<TableMetaResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const tableRef = ref();

const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<TableMetaResult | null>(null);

// 分页
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

// 查询表单
const queryForm = reactive<TableMetaQuery>({
  tableCode: '',
  tableName: '',
  module: '',
});

// 筛选字段
const filterFields = computed(() => [
  { key: 'tableCode', label: '表编码', type: 'input' as const, placeholder: '请输入表编码' },
  { key: 'tableName', label: '表名称', type: 'input' as const, placeholder: '请输入表名称' },
  {
    key: 'module',
    label: '所属模块',
    type: 'select' as const,
    placeholder: '请选择所属模块',
    options: [
      { label: '基础', value: 'base' },
      { label: 'WMS', value: 'wms' },
      { label: '系统', value: 'sys' },
    ],
  },
]);

// 表格列
const columns = computed<TableColumnsType<TableMetaResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '表编码', dataIndex: 'tableCode', key: 'tableCode', width: 150 },
  { title: '表名称', dataIndex: 'tableName', key: 'tableName', width: 180 },
  { title: '所属模块', dataIndex: 'module', key: 'module', width: 100 },
  { title: '实体类名', dataIndex: 'entityClass', key: 'entityClass', width: 200, ellipsis: true },
  { title: '服务类名', dataIndex: 'serviceClass', key: 'serviceClass', width: 200, ellipsis: true },
  { title: '权限标识', dataIndex: 'permissionCode', key: 'permissionCode', width: 150 },
  { title: '默认页大小', dataIndex: 'pageSize', key: 'pageSize', width: 100, align: 'center' },
  { title: '是否树形', key: 'isTree', width: 90, align: 'center' },
  { title: '状态', key: 'status', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
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
    message.error(error?.message || '表元数据列表加载失败');
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
    message.success('删除成功');
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleToggleStatus(record: TableMetaResult, checked: boolean) {
  try {
    await toggleTableMetaStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '启用成功' : '停用成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
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
    link.download = `表元数据_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('导出成功');
  } catch (error: any) {
    message.error(error?.message || '导出失败');
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
