<template>
  <Page auto-content-height>
    <div class="wms-supplier-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">WMS0020 供应商管理</h1>
          <p class="page-desc">管理供应商基本信息、联系方式等</p>
        </div>
        <div class="header-right">
          <Button type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            新建供应商
          </Button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="queryForm.supplierName"
              allow-clear
              placeholder="搜索供应商名称..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.isEnabled"
            allow-clear
            placeholder="全部状态"
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
                v-model:value="queryForm[field.key as keyof SupplierQuery]"
                allow-clear
                :placeholder="`请选择${field.label}`"
                class="filter-tag-select"
                :options="field.options"
                @change="handleSearch"
              />
              <Input
                v-else
                v-model:value="queryForm[field.key as keyof SupplierQuery]"
                allow-clear
                :placeholder="`请输入${field.label}`"
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
              添加筛选
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
            导出
          </Button>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <Truck />
            </div>
            <div class="stat-info">
              <p class="stat-label">供应商总数</p>
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
              <p class="stat-label">已启用</p>
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
              <p class="stat-label">已停用</p>
              <p class="stat-value">{{ disabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-contact" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Phone />
            </div>
            <div class="stat-info">
              <p class="stat-label">有联系方式</p>
              <p class="stat-value">{{ hasContactCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table -->
      <Card :bordered="false" class="table-card">
        <div class="toolbar">
          <Space wrap>
            <Popconfirm
              title="确认删除选中的供应商记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
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
                <Button
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该供应商记录吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- Edit Modal -->
      <SupplierModal
        ref="supplierModalRef"
        :supplier-id="currentEditId"
        v-model:open="modalVisible"
        @success="handleModalSuccess"
      />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import {
  Plus,
  Search,
  Download,
  Truck,
  Power,
  Ban,
  Phone,
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
  deleteSupplier,
  exportSupplier,
  listSupplierPage,
  toggleSupplierStatus,
  type SupplierQuery,
  type SupplierResult,
} from '#/api/sys/supplier';

import SupplierModal from './components/supplier-modal.vue';

const STORAGE_KEY = 'supplier_filter_fields';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<SupplierResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const supplierModalRef = ref<InstanceType<typeof SupplierModal>>();

interface FilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}

const allFieldDefs: FilterFieldDef[] = [
  { key: 'supplierCode', label: '供应商编码', type: 'input' },
  { key: 'supplierName', label: '供应商名称', type: 'input' },
  { key: 'contactPerson', label: '联系人', type: 'input' },
  { key: 'contactPhone', label: '联系电话', type: 'input' },
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
        .filter((f): f is FilterFieldDef => !!f);
    } else {
      // Default: show supplierCode and supplierName
      activeFilterFields.value = [
        { ...allFieldDefs[0] },
        { ...allFieldDefs[1] },
      ];
    }
  } catch {
    activeFilterFields.value = [
      { ...allFieldDefs[0] },
      { ...allFieldDefs[1] },
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
  activeFilterFields.value.push({ ...def });
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

const router = useRouter();

const queryForm = reactive<SupplierQuery>({
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  isEnabled: undefined,
});

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const hasContactCount = computed(() =>
  tableData.value.filter((item) => item.contactPhone || item.contactPerson).length
);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = computed<TableColumnsType<SupplierResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '供应商编码', dataIndex: 'supplierCode', key: 'supplierCode', width: 140 },
  { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
  { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson', width: 120 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 140 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
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
    supplierCode: queryForm.supplierCode?.trim() || undefined,
    supplierName: queryForm.supplierName?.trim() || undefined,
    contactPerson: queryForm.contactPerson?.trim() || undefined,
    contactPhone: queryForm.contactPhone?.trim() || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listSupplierPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || '供应商列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleReset() {
  queryForm.supplierCode = '';
  queryForm.supplierName = '';
  queryForm.contactPerson = '';
  queryForm.contactPhone = '';
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
  currentEditId.value = undefined;
  modalVisible.value = true;
}

function handleEdit(record: SupplierResult) {
  currentEditId.value = record.id;
  supplierModalRef.value?.open(record.id);
}

async function handleDelete(record: SupplierResult) {
  try {
    await deleteSupplier(record.id!);
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
    await Promise.all(selectedRowKeys.value.map((id) => deleteSupplier(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: SupplierResult, checked: boolean) {
  try {
    await toggleSupplierStatus(record.id!, checked ? 1 : 0);
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
    const blob = await exportSupplier(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `供应商管理_${Date.now()}.xlsx`;
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
  loadFilterFields();
  loadData();
});
</script>

<style scoped>
.wms-supplier-page {
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
