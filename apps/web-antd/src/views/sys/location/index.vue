<template>
  <Page auto-content-height>
    <div class="wms-location-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">{{ $t('page.wms.location.listTitle') }}</h1>
          <p class="page-desc">{{ $t('page.wms.location.listDescription') }}</p>
        </div>
        <div class="header-right">
          <Button type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            {{ $t('page.wms.location.add') }}
          </Button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="queryForm.locationName"
              allow-clear
              :placeholder="$t('page.wms.location.searchPlaceholder')"
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.isEnabled"
            allow-clear
            :placeholder="$t('page.wms.location.status.all')"
            class="status-select"
            :options="statusFilterOptions"
            @change="handleSearch"
          />
          <!-- Persistent filter field tags -->
          <div class="filter-tags-wrap">
            <div
              v-for="field in activeFilterFields"
              :key="field.key"
              class="filter-tag"
            >
              <span class="filter-tag-label">{{ field.label }}:</span>
              <Select
                v-if="field.type === 'select'"
                v-model:value="queryForm[field.key as keyof LocationQuery]"
                allow-clear
                :placeholder="$t('page.common.selectPlaceholder')"
                class="filter-tag-select"
                :options="field.options"
                @change="handleSearch"
              />
              <Input
                v-else
                v-model:value="queryForm[field.key as keyof LocationQuery]"
                allow-clear
                :placeholder="$t('page.common.inputPlaceholder')"
                class="filter-tag-input"
                @press-enter="handleSearch"
              />
              <X
                class="filter-tag-close"
                @click="removeFilterField(field.key)"
              />
            </div>
          </div>
          <!-- Add filter dropdown -->
          <Dropdown v-if="availableFields.length > 0" trigger="click">
            <Button>
              <template #icon><Plus /></template>
              {{ $t('page.wms.filter.addFilter') }}
              <ChevronDown />
            </Button>
            <template #overlay>
              <Menu>
                <MenuItem
                  v-for="item in availableFields"
                  :key="item.key"
                  @click="addFilterField(item.key)"
                >
                  {{ item.label }}
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.location.export') }}
          </Button>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <MapPin />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.location.stats.total') }}</p>
              <p class="stat-value">{{ pagination.total }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-enabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-green">
              <Power />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.location.stats.enabled') }}</p>
              <p class="stat-value">{{ enabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-disabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-orange">
              <Ban />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.location.stats.disabled') }}</p>
              <p class="stat-value">{{ disabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-storage" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Package />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.location.stats.storageArea') }}</p>
              <p class="stat-value">{{ storageCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table -->
      <Card :bordered="false" class="table-card">
        <div class="toolbar">
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
        </div>

        <Table
          row-key="id"
          :loading="loading"
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :row-selection="rowSelection"
          :scroll="{ x: 1200 }"
          @change="handleTableChange"
        >
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
                <Button
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
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
          </template>
        </Table>
      </Card>
    </div>

    <!-- Add/Edit Modal -->
    <LocationModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :record="currentRecord"
      :warehouse-options="warehouseOptions"
      @success="handleModalSuccess"
    />
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Plus,
  Search,
  Download,
  MapPin,
  Power,
  Ban,
  Package,
  ChevronDown,
  X,
} from 'lucide-vue-next';
import {
  Button,
  Card,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
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
import LocationModal from './modules/location-modal.vue';
import { $t } from '@vben/locales';

const STORAGE_KEY = 'location_filter_fields';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<LocationResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);

// Modal state
const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<LocationResult | null>(null);

// Warehouse options for dropdown
const warehouseOptions = ref<Array<{ label: string; value: number }>>([]);

interface FilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}

const allFieldDefs: FilterFieldDef[] = [
  { key: 'locationCode', label: $t('page.wms.location.filter.locationCode'), type: 'input' },
  { key: 'locationName', label: $t('page.wms.location.filter.locationName'), type: 'input' },
  { key: 'warehouseId', label: $t('page.wms.location.filter.warehouseId'), type: 'select', options: [] },
  { key: 'locationType', label: $t('page.wms.location.filter.locationType'), type: 'select', options: [] },
];

// Active filter fields shown as tags in the search bar
const activeFilterFields = ref<FilterFieldDef[]>([]);

function loadFilterFields() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const keys: string[] = JSON.parse(saved);
      activeFilterFields.value = keys
        .map((key) => allFieldDefs.find((f) => f.key === key))
        .filter((f): f is FilterFieldDef => !!f)
        .map((f) => ({
          ...f,
          options:
            f.key === 'locationType'
              ? locationTypeOptions
              : f.key === 'warehouseId'
              ? warehouseOptions.value
              : undefined,
        }));
    } else {
      // Default: show locationCode and locationName
      activeFilterFields.value = [
        { ...allFieldDefs[0], options: undefined },
        { ...allFieldDefs[1], options: undefined },
      ];
    }
  } catch {
    activeFilterFields.value = [
      { ...allFieldDefs[0], options: undefined },
      { ...allFieldDefs[1], options: undefined },
    ];
  }
}

function saveFilterFields() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(activeFilterFields.value.map((f) => f.key))
  );
}

function isFieldActive(key: string) {
  return activeFilterFields.value.some((f) => f.key === key);
}

function addFilterField(key: string) {
  if (isFieldActive(key)) return;
  const def = allFieldDefs.find((f) => f.key === key);
  if (!def) return;
  const field: FilterFieldDef = {
    ...def,
    options:
      def.key === 'locationType'
        ? locationTypeOptions
        : def.key === 'warehouseId'
        ? warehouseOptions.value
        : undefined,
  };
  activeFilterFields.value.push(field);
  saveFilterFields();
}

function removeFilterField(key: string) {
  activeFilterFields.value = activeFilterFields.value.filter(
    (f) => f.key !== key
  );
  // Clear the query form value
  (queryForm as any)[key] = undefined;
  saveFilterFields();
  handleSearch();
}

// Available fields = not yet added
const availableFields = computed(() =>
  allFieldDefs.filter((f) => !isFieldActive(f.key))
);

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

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.wms.table.totalRecords', { total }),
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

function handleReset() {
  queryForm.locationCode = '';
  queryForm.locationName = '';
  queryForm.warehouseId = undefined;
  queryForm.locationType = undefined;
  queryForm.isEnabled = undefined;
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

function handleEdit(record: LocationResult) {
  modalMode.value = 'edit';
  currentRecord.value = { ...record };
  modalVisible.value = true;
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
    link.download = `${$t('page.system.location.title')}_${Date.now()}.xlsx`;
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
  loadFilterFields();
  loadData();
});
</script>

<style scoped>
.wms-location-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right :deep(.ant-btn-primary) {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Filter Card */
.filter-card :deep(.ant-card-body) {
  padding: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  z-index: 1;
}

.search-input {
  padding-left: 36px !important;
}

.status-select {
  width: 140px;
}

.filter-tags-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
}

.filter-tag-label {
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.filter-tag-input {
  width: 120px;
  height: 26px;
}

.filter-tag-select {
  width: 120px;
  height: 26px;
}

.filter-tag-select :deep(.ant-select-selector) {
  height: 26px !important;
  padding: 0 8px !important;
}

.filter-tag-select :deep(.ant-select-selection-search-input) {
  height: 24px !important;
}

.filter-tag-close {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s;
}

.filter-tag-close:hover {
  color: #ef4444;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card :deep(.ant-card-body) {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap :deep(svg) {
  width: 20px;
  height: 20px;
}

.stat-icon-blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.stat-icon-green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.stat-icon-orange {
  background-color: #fff7ed;
  color: #ea580c;
}

.stat-icon-purple {
  background-color: #faf5ff;
  color: #9333ea;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

/* Table Card */
.table-card :deep(.ant-card-body) {
  padding: 0 16px 16px 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
