<template>
  <WmsPageLayout
    :title="$t('page.wms.location.listTitle')"
    :description="$t('page.wms.location.listDescription')"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="locationName"
        :search-placeholder="$t('page.wms.location.searchPlaceholder')"
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="wms:filter:location:activeFields"
        :default-field-keys="['locationCode', 'locationName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.location.export') }}
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
              :title="$t('page.wms.location.batchDeleteConfirm')"
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
          <template v-if="column.key === 'locationType'">
            {{ formatLocationType(record.locationType) }}
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
                :title="$t('page.wms.location.deleteConfirm')"
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
            {{ (record as any)[column.dataIndex as keyof LocationResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <LocationModal
    ref="locationModalRef"
    :location-id="currentEditId"
    v-model:visible="modalVisible"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  MapPin,
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
  deleteLocation,
  exportLocation,
  listLocationPage,
  listWarehouseSimple,
  toggleLocationStatus,
  type LocationQuery,
  type LocationResult,
} from '#/api/sys/location';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import LocationModal from './modules/location-modal.vue';
import { $t } from '@vben/locales';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<LocationResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const locationModalRef = ref<InstanceType<typeof LocationModal>>();

// Warehouse options for dropdown
const warehouseOptions = ref<Array<{ label: string; value: number }>>([]);

const pageActions = computed(() => [
  {
    label: $t('page.wms.location.add'),
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = computed(() => [
  { key: 'locationCode', label: $t('page.wms.location.filter.locationCode'), type: 'input' as const },
  { key: 'locationName', label: $t('page.wms.location.filter.locationName'), type: 'input' as const },
  { key: 'warehouseId', label: $t('page.wms.location.filter.warehouseId'), type: 'select' as const, options: warehouseOptions.value },
  { key: 'locationType', label: $t('page.wms.location.filter.locationType'), type: 'select' as const, options: locationTypeOptions },
]);

const queryForm = reactive<LocationQuery>({
  locationCode: '',
  locationName: '',
  warehouseId: undefined,
  locationType: undefined,
  isEnabled: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.location.status.all'), value: undefined },
  { label: $t('page.wms.location.status.enabled'), value: 1 },
  { label: $t('page.wms.location.status.disabled'), value: 0 },
]);

const locationTypeOptions = [
  { label: $t('page.wms.location.locationType.STORAGE'), value: 'STORAGE' },
  { label: $t('page.wms.location.locationType.PICK'), value: 'PICK' },
  { label: $t('page.wms.location.locationType.COLLECT'), value: 'COLLECT' },
  { label: $t('page.wms.location.locationType.RETURN'), value: 'RETURN' },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const storageCount = computed(() => tableData.value.filter((item) => item.locationType === 'STORAGE').length);

const statsCards = computed(() => [
  { key: 'total', label: $t('page.wms.location.stats.total'), icon: MapPin, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: $t('page.wms.location.stats.enabled'), icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: $t('page.wms.location.stats.disabled'), icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'storage', label: $t('page.wms.location.stats.storageArea'), icon: Package, tone: 'purple' as const, value: storageCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

const columns = computed<TableColumnsType<LocationResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.location.columns.locationCode'), dataIndex: 'locationCode', key: 'locationCode', width: 140 },
  { title: $t('page.wms.location.columns.locationName'), dataIndex: 'locationName', key: 'locationName', width: 160 },
  { title: $t('page.wms.location.columns.warehouseName'), dataIndex: 'warehouseName', key: 'warehouseName', width: 160 },
  { title: $t('page.wms.location.columns.locationType'), dataIndex: 'locationType', key: 'locationType', width: 120 },
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
    locationCode: queryForm.locationCode?.trim() || undefined,
    locationName: queryForm.locationName?.trim() || undefined,
    warehouseId: queryForm.warehouseId ?? undefined,
    locationType: queryForm.locationType || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listLocationPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error($t('page.wms.location.messages.loadFail'));
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

function handleEdit(record: LocationResult) {
  currentEditId.value = record.id;
  locationModalRef.value?.open(record.id);
}

async function handleDelete(record: LocationResult) {
  try {
    await deleteLocation(record.id!);
    message.success($t('page.wms.location.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.location.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.location.messages.selectToDelete'));
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteLocation(Number(id))));
    message.success($t('page.wms.location.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.location.messages.batchDeleteFail'));
  }
}

async function handleToggleStatus(record: LocationResult, checked: boolean) {
  try {
    await toggleLocationStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.location.messages.enableSuccess') : $t('page.wms.location.messages.disableSuccess'));
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.location.messages.statusToggleFail'));
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportLocation(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${$t('page.wms.location.exportFileName')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.location.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.location.messages.exportFail'));
  } finally {
    exporting.value = false;
  }
}

function formatLocationType(value?: string) {
  return locationTypeOptions.find((item) => item.value === value)?.label || value || '-';
}

function handleModalSuccess() {
  loadData();
}

async function loadWarehouseOptions() {
  try {
    warehouseOptions.value = await listWarehouseSimple();
  } catch (e) {
    warehouseOptions.value = [];
  }
}

onMounted(async () => {
  await loadWarehouseOptions();
  loadData();
});
</script>
