<template>
  <WmsPageLayout
    title="WMS0030 物料管理"
    description="管理物料基本信息、规格、单位、分类等"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="materialName"
        search-placeholder="搜索物料名称..."
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="wms:filter:material:activeFields"
        :default-field-keys="['materialCode', 'materialName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            导出
          </Button>
        </template>
      </WmsFilterBar>
    </template>

    <template #table>
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
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              title="确认删除选中的物料记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Popconfirm
                title="确认删除该物料记录吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
          <template v-else>
            {{ (record as any)[column.dataIndex as keyof MaterialResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <MaterialModal
    ref="materialModalRef"
    :material-id="currentEditId"
    v-model:open="modalVisible"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  Package,
  Power,
  Ban,
  Layers,
} from 'lucide-vue-next';
import {
  Button,
  Popconfirm,
  Space,
  Switch,
  message,
} from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  deleteMaterial,
  exportMaterial,
  listMaterialPage,
  toggleMaterialStatus,
  type MaterialQuery,
  type MaterialResult,
} from '#/api/sys/material';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import MaterialModal from './components/material-modal.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<MaterialResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const materialModalRef = ref<InstanceType<typeof MaterialModal>>();

const pageActions = computed(() => [
  {
    label: '新建物料',
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = [
  { key: 'materialCode', label: '物料编码', type: 'input' as const },
  { key: 'materialName', label: '物料名称', type: 'input' as const },
  { key: 'specification', label: '规格', type: 'input' as const },
  { key: 'unit', label: '单位', type: 'input' as const },
  { key: 'category', label: '分类', type: 'input' as const },
];

const queryForm = reactive<MaterialQuery>({
  materialCode: '',
  materialName: '',
  specification: '',
  unit: '',
  category: '',
  isEnabled: undefined,
});

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const categoryCount = computed(() =>
  new Set(tableData.value.map((item) => item.category).filter(Boolean)).size
);

const statsCards = computed(() => [
  { key: 'total', label: '物料总数', icon: Package, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: '已启用', icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: '已停用', icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'category', label: '物料分类', icon: Layers, tone: 'purple' as const, value: categoryCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = computed<TableColumnsType<MaterialResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 140 },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 180 },
  { title: '规格', dataIndex: 'specification', key: 'specification', width: 160 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 140 },
  { title: '状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    materialCode: queryForm.materialCode?.trim() || undefined,
    materialName: queryForm.materialName?.trim() || undefined,
    specification: queryForm.specification?.trim() || undefined,
    unit: queryForm.unit?.trim() || undefined,
    category: queryForm.category?.trim() || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listMaterialPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || '物料列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  currentEditId.value = undefined;
  modalVisible.value = true;
}

function handleEdit(record: MaterialResult) {
  currentEditId.value = record.id;
  materialModalRef.value?.open(record.id);
}

async function handleDelete(record: MaterialResult) {
  try {
    await deleteMaterial(record.id!);
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

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteMaterial(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: MaterialResult, checked: boolean) {
  try {
    await toggleMaterialStatus(record.id!, checked ? 1 : 0);
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
    const blob = await exportMaterial(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `物料管理_${Date.now()}.xlsx`;
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
