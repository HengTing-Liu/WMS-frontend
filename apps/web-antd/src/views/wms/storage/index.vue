<template>
  <WmsPageLayout
    :title="$t('page.wms.storage.listTitle')"
    :description="$t('page.wms.storage.listDescription')"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="storageName"
        :search-placeholder="$t('page.wms.storage.searchPlaceholder')"
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="wms:filter:storage:activeFields"
        :default-field-keys="['storageCode', 'storageName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.storage.export') }}
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
        :scroll="{ x: 1400 }"
        @change="handleTableChange"
      >
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              :title="$t('page.wms.storage.batchDeleteConfirm')"
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
          <template v-if="column.key === 'storageType'">
            {{ formatStorageType(record.storageType) }}
          </template>
          <template v-else-if="column.key === 'capacity'">
            {{ record.capacity ?? '-' }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
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
                :title="$t('page.wms.storage.deleteConfirm')"
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
            {{ (record as any)[column.dataIndex as keyof StorageResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <StorageModal
    ref="storageModalRef"
    :storage-id="currentEditId"
    v-model:open="modalVisible"
    :warehouse-options="warehouseOptions"
    :location-options="locationOptions"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  Grid3x3,
  Power,
  Ban,
  Package,
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
  deleteStorage,
  exportStorage,
  listLocationSimple,
  listStoragePage,
  toggleStorageStatus,
  type StorageQuery,
  type StorageResult,
} from '#/api/wms/storage';
import { listWarehouseSimpleForLocation } from '#/api/sys/warehouse';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import StorageModal from '#/views/sys/storage/components/storage-modal.vue';
import { $t } from '@vben/locales';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<StorageResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const storageModalRef = ref<InstanceType<typeof StorageModal>>();

// Dropdown options
const warehouseOptions = ref<Array<{ label: string; value: number }>>([]);
const locationOptions = ref<Array<{ label: string; value: number }>>([]);

const pageActions = computed(() => [
  {
    label: $t('page.wms.storage.add'),
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = computed(() => [
  { key: 'storageCode', label: $t('page.wms.storage.filter.storageCode'), type: 'input' as const },
  { key: 'storageName', label: $t('page.wms.storage.filter.storageName'), type: 'input' as const },
  { key: 'warehouseId', label: $t('page.wms.storage.filter.warehouseId'), type: 'select' as const, options: warehouseOptions },
  { key: 'locationId', label: $t('page.wms.storage.filter.locationId'), type: 'select' as const, options: locationOptions },
  { key: 'storageType', label: $t('page.wms.storage.filter.storageType'), type: 'select' as const, options: storageTypeOptions },
]);

const queryForm = reactive<StorageQuery>({
  storageCode: '',
  storageName: '',
  warehouseId: undefined,
  locationId: undefined,
  storageType: undefined,
  isEnabled: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.storage.status.all'), value: undefined },
  { label: $t('page.wms.storage.status.enabled'), value: 1 },
  { label: $t('page.wms.storage.status.disabled'), value: 0 },
]);

const storageTypeOptions = [
  { label: $t('page.wms.storage.storageType.PLANE'), value: 'PLANE' },
  { label: $t('page.wms.storage.storageType.STEREO'), value: 'STEREO' },
  { label: $t('page.wms.storage.storageType.RACK'), value: 'RACK' },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const totalCapacity = computed(() => tableData.value.reduce((sum, item) => sum + (item.capacity ?? 0), 0));

const statsCards = computed(() => [
  { key: 'total', label: $t('page.wms.storage.stats.total'), icon: Grid3x3, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: $t('page.wms.storage.stats.enabled'), icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: $t('page.wms.storage.stats.disabled'), icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'capacity', label: $t('page.wms.storage.stats.totalCapacity'), icon: Package, tone: 'purple' as const, value: totalCapacity.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

const columns = computed<TableColumnsType<StorageResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.storage.columns.storageCode'), dataIndex: 'storageCode', key: 'storageCode', width: 140 },
  { title: $t('page.wms.storage.columns.storageName'), dataIndex: 'storageName', key: 'storageName', width: 160 },
  { title: $t('page.wms.storage.columns.locationName'), dataIndex: 'locationName', key: 'locationName', width: 160 },
  { title: $t('page.wms.storage.columns.warehouseName'), dataIndex: 'warehouseName', key: 'warehouseName', width: 140 },
  { title: $t('page.wms.storage.columns.storageType'), dataIndex: 'storageType', key: 'storageType', width: 120 },
  { title: $t('page.wms.storage.columns.capacity'), dataIndex: 'capacity', key: 'capacity', width: 100 },
  { title: $t('page.common.status'), dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: $t('page.common.createTime'), dataIndex: 'createTime', key: 'createTime', width: 180 },
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
    storageCode: queryForm.storageCode?.trim() || undefined,
    storageName: queryForm.storageName?.trim() || undefined,
    warehouseId: queryForm.warehouseId ?? undefined,
    locationId: queryForm.locationId ?? undefined,
    storageType: queryForm.storageType || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listStoragePage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error($t('page.wms.storage.messages.loadFail'));
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

function handleEdit(record: StorageResult) {
  currentEditId.value = record.id;
  storageModalRef.value?.open(record.id);
}

async function handleDelete(record: StorageResult) {
  try {
    await deleteStorage(record.id!);
    message.success($t('page.wms.storage.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.storage.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.storage.messages.selectToDelete'));
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteStorage(Number(id))));
    message.success($t('page.wms.storage.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.storage.messages.batchDeleteFail'));
  }
}

async function handleToggleStatus(record: StorageResult, checked: boolean) {
  try {
    await toggleStorageStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.storage.messages.enableSuccess') : $t('page.wms.storage.messages.disableSuccess'));
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.storage.messages.statusToggleFail'));
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportStorage(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${$t('page.system.location.title')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.storage.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.storage.messages.exportFail'));
  } finally {
    exporting.value = false;
  }
}

function formatStorageType(value?: string) {
  return storageTypeOptions.find((item) => item.value === value)?.label || value || '-';
}

function handleModalSuccess() {
  loadData();
}

async function loadDropdownOptions() {
  try {
    const [wh, loc] = await Promise.all([listWarehouseSimpleForLocation(), listLocationSimple()]);
    warehouseOptions.value = wh;
    locationOptions.value = loc;
  } catch (e) {
    warehouseOptions.value = [];
    locationOptions.value = [];
  }
}

onMounted(async () => {
  await loadDropdownOptions();
  loadData();
});
</script>
