<template>
  <Page auto-content-height>
    <div class="wms-dict-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">WMS0070 字典管理</h1>
          <p class="page-desc">管理系统字典类型和字典数据，支持增删改查和状态管理</p>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="searchKeyword"
              allow-clear
              :placeholder="activeTab === 'type' ? '搜索字典名称...' : '搜索字典标签...'"
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="statusValue"
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
                v-model:value="activeQueryForm[field.key as keyof any]"
                allow-clear
                :placeholder="`请选择${field.label}`"
                class="filter-tag-select"
                :options="field.options"
                @change="handleSearch"
              />
              <Input
                v-else
                v-model:value="activeQueryForm[field.key as keyof any]"
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

      <!-- Tabs -->
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <TabPane key="type">
          <template #tab>
            <span class="tab-label">
              <BookTemplate :size="16" />
              字典类型
            </span>
          </template>
        </TabPane>
        <TabPane key="data">
          <template #tab>
            <span class="tab-label">
              <List :size="16" />
              字典数据
            </span>
          </template>
        </TabPane>
      </Tabs>

      <!-- Stats Cards (Type) -->
      <div v-if="activeTab === 'type'" class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <BookTemplate />
            </div>
            <div class="stat-info">
              <p class="stat-label">字典类型</p>
              <p class="stat-value">{{ typePagination.total }}</p>
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
              <p class="stat-value">{{ typeEnabledCount }}</p>
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
              <p class="stat-value">{{ typeDisabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-custom" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Star />
            </div>
            <div class="stat-info">
              <p class="stat-label">自定义类型</p>
              <p class="stat-value">{{ typeCustomCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Stats Cards (Data) -->
      <div v-if="activeTab === 'data'" class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <List />
            </div>
            <div class="stat-info">
              <p class="stat-label">字典数据</p>
              <p class="stat-value">{{ dataPagination.total }}</p>
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
              <p class="stat-value">{{ dataEnabledCount }}</p>
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
              <p class="stat-value">{{ dataDisabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-type" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <BookTemplate />
            </div>
            <div class="stat-info">
              <p class="stat-label">字典类型</p>
              <p class="stat-value">{{ dataTypeCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table: Dict Type -->
      <Card v-if="activeTab === 'type'" :bordered="false" class="table-card">
        <div class="toolbar">
          <Space wrap>
            <Popconfirm
              title="确认删除选中的字典类型吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDeleteType"
            >
              <Button danger :disabled="selectedTypeRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
          <Button type="primary" @click="handleAddType">
            <template #icon><Plus /></template>
            新建类型
          </Button>
        </div>

        <Table
          row-key="id"
          :loading="typeLoading"
          :columns="typeColumns"
          :data-source="typeTableData"
          :pagination="typePagination"
          :row-selection="typeRowSelection"
          :scroll="{ x: 1000 }"
          @change="handleTableChangeType"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'dictType'">
              {{ formatDictType(record.dictType) }}
            </template>
            <template v-else-if="column.key === 'isEnabled'">
              <Switch
                :checked="record.isEnabled === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="(checked) => handleToggleTypeStatus(record, checked)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="handleEditType(record)">
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该字典类型吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteType(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- Data Table: Dict Data -->
      <Card v-if="activeTab === 'data'" :bordered="false" class="table-card">
        <div class="toolbar">
          <Space wrap>
            <Popconfirm
              title="确认删除选中的字典数据吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDeleteData"
            >
              <Button danger :disabled="selectedDataRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
          <Button type="primary" @click="handleAddData">
            <template #icon><Plus /></template>
            新建数据
          </Button>
        </div>

        <Table
          row-key="id"
          :loading="dataLoading"
          :columns="dataColumns"
          :data-source="dataTableData"
          :pagination="dataPagination"
          :row-selection="dataRowSelection"
          :scroll="{ x: 1200 }"
          @change="handleTableChangeData"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'isEnabled'">
              <Switch
                :checked="record.isEnabled === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="(checked) => handleToggleDataStatus(record, checked)"
              />
            </template>
            <template v-else-if="column.key === 'sortOrder'">
              {{ record.sortOrder ?? '-' }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="handleEditData(record)">
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该字典数据吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteData(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <!-- Dict Type Modal -->
    <DictTypeModal
      ref="dictTypeModalRef"
      :dict-type-id="currentTypeId"
      v-model:open="typeModalVisible"
      @success="handleTypeModalSuccess"
    />

    <!-- Dict Data Modal -->
    <DictDataModal
      ref="dictDataModalRef"
      :dict-data-id="currentDataId"
      v-model:open="dataModalVisible"
      :dict-type-options="dictTypeOptions"
      @success="handleDataModalSuccess"
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
  BookTemplate,
  List,
  Power,
  Ban,
  Star,
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
  Tabs,
  TabPane,
  message,
} from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  exportDictData,
  exportDictType,
  listDictDataPage,
  listDictTypePage,
  listDictTypeSimple,
  toggleDictDataStatus,
  toggleDictTypeStatus,
  type DictDataQuery,
  type DictDataResult,
  type DictTypeQuery,
  type DictTypeResult,
  updateDictData,
  updateDictType,
} from '#/api/sys/dict';

import DictTypeModal from './modules/dict-type-modal.vue';
import DictDataModal from './modules/dict-data-modal.vue';

const STORAGE_KEY_TYPE = 'dict_type_filter_fields';
const STORAGE_KEY_DATA = 'dict_data_filter_fields';

// ========== Tab State ==========
const activeTab = ref<'type' | 'data'>('type');

const searchKeyword = computed({
  get: () => activeTab.value === 'type' ? queryTypeForm.dictName : queryDataForm.dictLabel,
  set: (val) => {
    if (activeTab.value === 'type') {
      queryTypeForm.dictName = val;
    } else {
      queryDataForm.dictLabel = val;
    }
  },
});

const statusValue = computed({
  get: () => activeTab.value === 'type' ? queryTypeForm.isEnabled : queryDataForm.isEnabled,
  set: (val) => {
    if (activeTab.value === 'type') {
      queryTypeForm.isEnabled = val;
    } else {
      queryDataForm.isEnabled = val;
    }
  },
});

// ========== Type List State ==========
const typeLoading = ref(false);
const exporting = ref(false);
const typeTableData = ref<DictTypeResult[]>([]);
const selectedTypeRowKeys = ref<Array<number | string>>([]);
const typeModalVisible = ref(false);
const currentTypeId = ref<number>();
const dictTypeModalRef = ref<InstanceType<typeof DictTypeModal>>();
const dictTypeOptions = ref<Array<{ label: string; value: string }>>([]);

const queryTypeForm = reactive<DictTypeQuery>({
  dictCode: '',
  dictName: '',
  isEnabled: undefined,
});

const typePagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const typeEnabledCount = computed(() => typeTableData.value.filter((item) => item.isEnabled === 1).length);
const typeDisabledCount = computed(() => typeTableData.value.filter((item) => item.isEnabled === 0).length);
const typeCustomCount = computed(() => typeTableData.value.filter((item) => item.dictType === 'custom').length);

const typeColumns = computed<TableColumnsType<DictTypeResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((typePagination.current || 1) - 1) * (typePagination.pageSize || 10) + index + 1}` },
  { title: '字典编码', dataIndex: 'dictCode', key: 'dictCode', width: 180 },
  { title: '字典名称', dataIndex: 'dictName', key: 'dictName', width: 180 },
  { title: '类型', dataIndex: 'dictType', key: 'dictType', width: 120 },
  { title: '状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
]);

const typeRowSelection = computed(() => ({
  selectedRowKeys: selectedTypeRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedTypeRowKeys.value = keys;
  },
}));

// ========== Data List State ==========
const dataLoading = ref(false);
const dataTableData = ref<DictDataResult[]>([]);
const selectedDataRowKeys = ref<Array<number | string>>([]);
const dataModalVisible = ref(false);
const currentDataId = ref<number>();
const dictDataModalRef = ref<InstanceType<typeof DictDataModal>>();

const queryDataForm = reactive<DictDataQuery>({
  dictType: undefined,
  dictLabel: '',
  dictValue: '',
  isEnabled: undefined,
});

const dataPagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const dataEnabledCount = computed(() => dataTableData.value.filter((item) => item.isEnabled === 1).length);
const dataDisabledCount = computed(() => dataTableData.value.filter((item) => item.isEnabled === 0).length);
const dataTypeCount = computed(() => new Set(dataTableData.value.map((item) => item.dictType)).size);

const dataColumns = computed<TableColumnsType<DictDataResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((dataPagination.current || 1) - 1) * (dataPagination.pageSize || 10) + index + 1}` },
  { title: '所属类型', dataIndex: 'dictTypeName', key: 'dictTypeName', width: 160 },
  { title: '字典标签', dataIndex: 'dictLabel', key: 'dictLabel', width: 160 },
  { title: '字典值', dataIndex: 'dictValue', key: 'dictValue', width: 160 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
  { title: '状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
]);

const dataRowSelection = computed(() => ({
  selectedRowKeys: selectedDataRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedDataRowKeys.value = keys;
  },
}));

// ========== Filter Fields ==========
interface FilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}

const typeFieldDefs: FilterFieldDef[] = [
  { key: 'dictCode', label: '字典编码', type: 'input' },
  { key: 'dictName', label: '字典名称', type: 'input' },
];

const dataFieldDefs: FilterFieldDef[] = [
  { key: 'dictType', label: '所属类型', type: 'select', options: [] },
  { key: 'dictLabel', label: '字典标签', type: 'input' },
  { key: 'dictValue', label: '字典值', type: 'input' },
];

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const activeFilterFields = ref<FilterFieldDef[]>([]);

function getStorageKey() {
  return activeTab.value === 'type' ? STORAGE_KEY_TYPE : STORAGE_KEY_DATA;
}

function getAllFieldDefs(): FilterFieldDef[] {
  if (activeTab.value === 'type') return typeFieldDefs;
  return dataFieldDefs.map((f) => ({
    ...f,
    options: f.key === 'dictType' ? dictTypeOptions.value : f.options,
  }));
}

function loadFilterFields() {
  try {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const keys: string[] = JSON.parse(saved);
      activeFilterFields.value = keys
        .map((key) => getAllFieldDefs().find((f) => f.key === key))
        .filter((f): f is FilterFieldDef => !!f);
    } else {
      const defs = getAllFieldDefs();
      activeFilterFields.value = [defs[0], defs[1]].filter(Boolean);
    }
  } catch {
    const defs = getAllFieldDefs();
    activeFilterFields.value = [defs[0], defs[1]].filter(Boolean);
  }
}

function saveFilterFields() {
  localStorage.setItem(getStorageKey(), JSON.stringify(activeFilterFields.value.map((f) => f.key)));
}

function isFieldActive(key: string) {
  return activeFilterFields.value.some((f) => f.key === key);
}

function addFilterField(key: string) {
  if (isFieldActive(key)) return;
  const def = getAllFieldDefs().find((f) => f.key === key);
  if (!def) return;
  activeFilterFields.value.push({ ...def });
  saveFilterFields();
}

function removeFilterField(key: string) {
  activeFilterFields.value = activeFilterFields.value.filter((f) => f.key !== key);
  (activeQueryForm as any)[key] = undefined;
  saveFilterFields();
  handleSearch();
}

const availableFields = computed(() => getAllFieldDefs().filter((f) => !isFieldActive(f.key)));

const activeQueryForm = computed(() => activeTab.value === 'type' ? queryTypeForm : queryDataForm);

// ========== Load Data ==========
async function loadTypeData() {
  typeLoading.value = true;
  try {
    const res = await listDictTypePage({
      pageNum: typePagination.current || 1,
      pageSize: typePagination.pageSize || 10,
      dictCode: queryTypeForm.dictCode?.trim() || undefined,
      dictName: queryTypeForm.dictName?.trim() || undefined,
      isEnabled: queryTypeForm.isEnabled ?? undefined,
    });
    typeTableData.value = res.rows || [];
    typePagination.total = res.total || 0;
  } catch (error: any) {
    typeTableData.value = [];
    typePagination.total = 0;
    message.error(error?.message || '字典类型列表加载失败');
  } finally {
    typeLoading.value = false;
  }
}

async function loadDataData() {
  dataLoading.value = true;
  try {
    const res = await listDictDataPage({
      pageNum: dataPagination.current || 1,
      pageSize: dataPagination.pageSize || 10,
      dictType: queryDataForm.dictType || undefined,
      dictLabel: queryDataForm.dictLabel?.trim() || undefined,
      dictValue: queryDataForm.dictValue?.trim() || undefined,
      isEnabled: queryDataForm.isEnabled ?? undefined,
    });
    dataTableData.value = res.rows || [];
    dataPagination.total = res.total || 0;
  } catch (error: any) {
    dataTableData.value = [];
    dataPagination.total = 0;
    message.error(error?.message || '字典数据列表加载失败');
  } finally {
    dataLoading.value = false;
  }
}

function handleSearch() {
  if (activeTab.value === 'type') {
    typePagination.current = 1;
    loadTypeData();
  } else {
    dataPagination.current = 1;
    loadDataData();
  }
}

function handleTabChange(tab: string) {
  selectedTypeRowKeys.value = [];
  selectedDataRowKeys.value = [];
  loadFilterFields();
  if (tab === 'type') {
    loadTypeData();
  } else {
    loadDataData();
  }
}

function handleTableChangeType(page: TablePaginationConfig) {
  typePagination.current = page.current || 1;
  typePagination.pageSize = page.pageSize || 10;
  loadTypeData();
}

function handleTableChangeData(page: TablePaginationConfig) {
  dataPagination.current = page.current || 1;
  dataPagination.pageSize = page.pageSize || 10;
  loadDataData();
}

// ========== Type CRUD ==========
function handleAddType() {
  currentTypeId.value = undefined;
  typeModalVisible.value = true;
}

function handleEditType(record: DictTypeResult) {
  currentTypeId.value = record.id;
  dictTypeModalRef.value?.open(record.id);
}

async function handleDeleteType(record: DictTypeResult) {
  try {
    await deleteDictType(record.id!);
    message.success('删除成功');
    if (typeTableData.value.length === 1 && (typePagination.current || 1) > 1) {
      typePagination.current = (typePagination.current || 1) - 1;
    }
    selectedTypeRowKeys.value = selectedTypeRowKeys.value.filter((key) => key !== record.id);
    await loadTypeData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDeleteType() {
  if (selectedTypeRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  try {
    await Promise.all(selectedTypeRowKeys.value.map((id) => deleteDictType(Number(id))));
    message.success('删除成功');
    selectedTypeRowKeys.value = [];
    typePagination.current = 1;
    await loadTypeData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleTypeStatus(record: DictTypeResult, checked: boolean) {
  try {
    await toggleDictTypeStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '启用成功' : '停用成功');
    await loadTypeData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
    await loadTypeData();
  }
}

function handleTypeModalSuccess() {
  loadTypeData();
}

// ========== Data CRUD ==========
function handleAddData() {
  currentDataId.value = undefined;
  dataModalVisible.value = true;
}

function handleEditData(record: DictDataResult) {
  currentDataId.value = record.id;
  dictDataModalRef.value?.open(record.id);
}

async function handleDeleteData(record: DictDataResult) {
  try {
    await deleteDictData(record.id!);
    message.success('删除成功');
    if (dataTableData.value.length === 1 && (dataPagination.current || 1) > 1) {
      dataPagination.current = (dataPagination.current || 1) - 1;
    }
    selectedDataRowKeys.value = selectedDataRowKeys.value.filter((key) => key !== record.id);
    await loadDataData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDeleteData() {
  if (selectedDataRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  try {
    await Promise.all(selectedDataRowKeys.value.map((id) => deleteDictData(Number(id))));
    message.success('删除成功');
    selectedDataRowKeys.value = [];
    dataPagination.current = 1;
    await loadDataData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleDataStatus(record: DictDataResult, checked: boolean) {
  try {
    await toggleDictDataStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '启用成功' : '停用成功');
    await loadDataData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
    await loadDataData();
  }
}

function handleDataModalSuccess() {
  loadDataData();
}

// ========== Export ==========
async function handleExport() {
  exporting.value = true;
  try {
    const blob = activeTab.value === 'type'
      ? await exportDictType({ dictCode: queryTypeForm.dictCode, dictName: queryTypeForm.dictName, isEnabled: queryTypeForm.isEnabled })
      : await exportDictData({ dictType: queryDataForm.dictType, dictLabel: queryDataForm.dictLabel, dictValue: queryDataForm.dictValue, isEnabled: queryDataForm.isEnabled });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab.value === 'type' ? '字典类型' : '字典数据'}_${Date.now()}.xlsx`;
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

// ========== Helpers ==========
function formatDictType(value?: string) {
  const map: Record<string, string> = { system: '系统字典', custom: '自定义' };
  return map[value || ''] || value || '-';
}

// ========== Init ==========
async function loadDictTypeOptions() {
  try {
    dictTypeOptions.value = await listDictTypeSimple();
  } catch {
    dictTypeOptions.value = [];
  }
}

onMounted(async () => {
  await loadDictTypeOptions();
  loadFilterFields();
  loadTypeData();
});
</script>

<style scoped>
.wms-dict-page {
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

/* Tabs */
:deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
