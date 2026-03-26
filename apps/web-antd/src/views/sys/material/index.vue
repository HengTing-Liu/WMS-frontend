<template>
  <WmsPageLayout
    :title="$t('page.wms.material.listTitle')"
    :description="$t('page.wms.material.listDescription')"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="materialName"
        :search-placeholder="$t('page.wms.material.searchPlaceholder')"
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
            {{ $t('page.wms.material.export') }}
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
              :title="$t('page.wms.material.batchDeleteConfirm')"
              :ok-text="$t('page.common.confirm')"
              :cancel-text="$t('page.common.cancel')"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">
                {{ $t('page.common.delete') }}
              </Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              :checked-children="$t('page.common.enabled')"
              :un-checked-children="$t('page.common.disabled')"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                {{ $t('page.common.edit') }}
              </Button>
              <Popconfirm
                :title="$t('page.wms.material.deleteConfirm')"
                :ok-text="$t('page.common.confirm')"
                :cancel-text="$t('page.common.cancel')"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">
                  {{ $t('page.common.delete') }}
                </Button>
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
import { $t } from '@vben/locales';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<MaterialResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const materialModalRef = ref<InstanceType<typeof MaterialModal>>();

const pageActions = computed(() => [
  {
    label: $t('page.wms.material.add'),
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = computed(() => [
  { key: 'materialCode', label: $t('page.wms.material.filter.materialCode'), type: 'input' as const },
  { key: 'materialName', label: $t('page.wms.material.filter.materialName'), type: 'input' as const },
  { key: 'specification', label: $t('page.wms.material.filter.specification'), type: 'input' as const },
  { key: 'unit', label: $t('page.wms.material.filter.unit'), type: 'input' as const },
  { key: 'category', label: $t('page.wms.material.filter.category'), type: 'input' as const },
]);

const queryForm = reactive<MaterialQuery>({
  materialCode: '',
  materialName: '',
  specification: '',
  unit: '',
  category: '',
  isEnabled: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.material.status.all'), value: undefined },
  { label: $t('page.wms.material.status.enabled'), value: 1 },
  { label: $t('page.wms.material.status.disabled'), value: 0 },
]);

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const categoryCount = computed(() =>
  new Set(tableData.value.map((item) => item.category).filter(Boolean)).size
);

const statsCards = computed(() => [
  { key: 'total', label: $t('page.wms.material.stats.total'), icon: Package, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: $t('page.wms.material.stats.enabled'), icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: $t('page.wms.material.stats.disabled'), icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'category', label: $t('page.wms.material.stats.category'), icon: Layers, tone: 'purple' as const, value: categoryCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

const columns = computed<TableColumnsType<MaterialResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.material.columns.materialCode'), dataIndex: 'materialCode', key: 'materialCode', width: 140 },
  { title: $t('page.wms.material.columns.materialName'), dataIndex: 'materialName', key: 'materialName', width: 180 },
  { title: $t('page.wms.material.columns.specification'), dataIndex: 'specification', key: 'specification', width: 160 },
  { title: $t('page.wms.material.columns.unit'), dataIndex: 'unit', key: 'unit', width: 100 },
  { title: $t('page.wms.material.columns.category'), dataIndex: 'category', key: 'category', width: 140 },
  { title: $t('page.common.status'), dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: $t('page.wms.material.columns.createTime'), dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: $t('page.common.operation'), key: 'action', fixed: 'right', width: 140 },
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
    message.error($t('page.wms.material.messages.loadFail'));
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
    message.success($t('page.wms.material.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.material.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.material.messages.selectToDelete'));
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteMaterial(Number(id))));
    message.success($t('page.wms.material.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.material.messages.batchDeleteFail'));
  }
}

async function handleToggleStatus(record: MaterialResult, checked: boolean) {
  try {
    await toggleMaterialStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.material.messages.enableSuccess') : $t('page.wms.material.messages.disableSuccess'));
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.material.messages.statusToggleFail'));
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
    link.download = `${$t('page.material.title')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.material.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.material.messages.exportFail'));
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
