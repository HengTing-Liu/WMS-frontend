<template>
  <WmsPageLayout title="表元数据" description="管理低代码表元数据配置">
    <template #filter>
      <Card :bordered="false">
        <Space wrap>
          <Input
            v-model:value="queryForm.tableCode"
            placeholder="表编码"
            allow-clear
            style="width: 220px"
            @press-enter="handleSearch"
          />
          <Input
            v-model:value="queryForm.tableName"
            placeholder="表名称"
            allow-clear
            style="width: 220px"
            @press-enter="handleSearch"
          />
          <Select
            v-model:value="queryForm.module"
            placeholder="所属模块"
            allow-clear
            show-search
            option-filter-prop="label"
            :loading="moduleFilterLoading"
            style="width: 240px"
          >
            <SelectOption
              v-for="opt in moduleFilterSelectOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectOption>
          </Select>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </Card>
    </template>

    <template #actions>
      <Button type="primary" :loading="exporting" @click="handleExport">
        <template #icon><Download /></template>
        导出
      </Button>
      <Button type="primary" @click="handleAdd">
        <template #icon><Plus /></template>
        新增
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
        <template v-else-if="column.key === 'showCheckbox'">
          {{ record.showCheckbox === 1 ? '是' : '否' }}
        </template>
        <template v-else-if="column.key === 'showIndex'">
          {{ record.showIndex === 1 ? '是' : '否' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="record.status === 1"
            @change="(checked: boolean) => handleToggleStatus(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Popconfirm
              title="确定删除该条表元数据？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <Button type="link" size="small" danger>删除</Button>
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
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { Button, Card, Input, Popconfirm, Select, SelectOption, Space, Switch, message } from 'ant-design-vue';
import { Download, Plus } from 'lucide-vue-next';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import {
  deleteTableMeta,
  exportTableMeta,
  getTableMetaList,
  getTableMetaModuleOptions,
  toggleTableMetaStatus,
  type TableMetaModuleOption,
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

type TableMetaPageState = {
  pagination: Pick<TablePaginationConfig, 'current' | 'pageSize' | 'total'>;
  queryForm: TableMetaQuery;
  selectedRowKeys: Array<number | string>;
  tableData: TableMetaResult[];
};

const TABLE_META_STATE_KEY = 'system-table-meta-page-state-v1';
const tableMetaPageState = ref<TableMetaPageState | null>(null);

function savePageState() {
  const state: TableMetaPageState = {
    pagination: {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
    queryForm: { ...queryForm },
    selectedRowKeys: [...selectedRowKeys.value],
    tableData: [...tableData.value],
  };
  tableMetaPageState.value = state;
  try {
    sessionStorage.setItem(TABLE_META_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function restorePageState(): boolean {
  let state = tableMetaPageState.value;
  if (!state) {
    try {
      const raw = sessionStorage.getItem(TABLE_META_STATE_KEY);
      if (raw) state = JSON.parse(raw) as TableMetaPageState;
    } catch {
      // ignore
    }
  }
  if (!state) return false;
  tableMetaPageState.value = state;
  pagination.current = state.pagination.current;
  pagination.pageSize = state.pagination.pageSize;
  pagination.total = state.pagination.total;
  queryForm.tableCode = state.queryForm.tableCode || '';
  queryForm.tableName = state.queryForm.tableName || '';
  queryForm.module = state.queryForm.module || '';
  selectedRowKeys.value = [...(state.selectedRowKeys || [])];
  tableData.value = [...(state.tableData || [])];
  return true;
}

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const queryForm = reactive<TableMetaQuery>({
  tableCode: '',
  tableName: '',
  module: '',
});

const moduleFilterFromApi = ref<TableMetaModuleOption[]>([]);
const moduleFilterLoading = ref(false);

/** 与编辑弹窗同源；当前筛选值若不在接口列表中（历史数据）仍可选 */
const moduleFilterSelectOptions = computed(() => {
  const rows = [...moduleFilterFromApi.value];
  const v = (queryForm.module ?? '').trim();
  if (v && !rows.some((r) => r.value === v)) {
    rows.unshift({ value: v, label: `${v}（当前筛选）` });
  }
  return rows;
});

async function loadModuleFilterOptions() {
  moduleFilterLoading.value = true;
  try {
    moduleFilterFromApi.value = await getTableMetaModuleOptions();
  } catch {
    moduleFilterFromApi.value = [];
  } finally {
    moduleFilterLoading.value = false;
  }
}

const columns = computed<TableColumnsType<TableMetaResult>>(() => [
  {
    title: '序号',
    key: 'index',
    width: 70,
    customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}`,
  },
  { title: '表编码', dataIndex: 'tableCode', key: 'tableCode', width: 150 },
  { title: '表名称', dataIndex: 'tableName', key: 'tableName', width: 180 },
  { title: '页面类型', dataIndex: 'pageType', key: 'pageType', width: 120 },
  { title: '默认条件(JSON)', dataIndex: 'defaultQueryJson', key: 'defaultQueryJson', width: 200, ellipsis: true },
  { title: '所属模块', dataIndex: 'module', key: 'module', width: 100 },
  { title: '分页大小', dataIndex: 'pageSize', key: 'pageSize', width: 100, align: 'center' },
  { title: '是否树形', key: 'isTree', width: 96, align: 'center' },
  { title: '是否可选', key: 'showCheckbox', width: 96, align: 'center' },
  { title: '显示序号', key: 'showIndex', width: 96, align: 'center' },
  { title: '状态', key: 'status', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks', width: 200, ellipsis: true },
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
    message.error(error?.message || '加载表元数据失败');
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
    message.success(checked ? '已启用' : '已停用');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '切换状态失败');
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

onMounted(async () => {
  await loadModuleFilterOptions();
  restorePageState();
  if (!tableData.value.length) {
    await loadData();
  }
});

watch([tableData, selectedRowKeys], savePageState, { deep: true });
watch(
  () => [pagination.current, pagination.pageSize, pagination.total, queryForm.tableCode, queryForm.tableName, queryForm.module],
  savePageState,
);

onActivated(() => {
  // When keep-alive instance is already warm, keep in-memory state as-is.
  if (tableData.value.length === 0) {
    restorePageState();
    if (!tableData.value.length) {
      loadData();
    }
  }
  if (moduleFilterFromApi.value.length === 0) {
    loadModuleFilterOptions();
  }
});
onDeactivated(() => {
  savePageState();
});
onBeforeUnmount(() => {
  savePageState();
});
</script>
