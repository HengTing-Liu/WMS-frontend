<template>
  <WmsPageLayout
    title="WMS0070 字典管理"
    description="管理系统字典类型和字典数据，支持增删改查和状态管理"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="activeQueryForm"
        :search-key="activeSearchKey"
        :search-placeholder="activeSearchPlaceholder"
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        :storage-key="activeStorageKey"
        :default-field-keys="activeDefaultFieldKeys"
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
        :loading="activeLoading"
        :columns="activeColumns"
        :data-source="activeTableData"
        :pagination="activePagination"
        :row-selection="activeRowSelection"
        :scroll="{ x: activeTab === 'type' ? 1000 : 1200 }"
        @change="handleTableChange"
      >
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              :title="activeTab === 'type' ? '确认删除选中的字典类型吗？' : '确认删除选中的字典数据吗？'"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="activeSelectedRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dictType'">
            {{ formatDictType(record.dictType) }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked: any) => handleToggleStatus(record, checked as boolean)"
            />
          </template>
          <template v-else-if="column.key === 'sortOrder'">
            {{ record.sortOrder ?? '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Popconfirm
                :title="activeTab === 'type' ? '确认删除该字典类型吗？' : '确认删除该字典数据吗？'"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
          <template v-else>
            {{ (record as any)[column.dataIndex as keyof any] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <!-- Tabs -->
  <Card :bordered="false" class="dict-tabs-card">
    <Tabs v-model:activeKey="activeTab" @change="(key) => handleTabChange(key as string)">
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
  </Card>

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
</template>

<script setup lang="ts">
import { BookTemplate, List, Plus, Download, Power, Ban, Star } from 'lucide-vue-next';
import { Button, Card, Popconfirm, Space, Switch, Tabs, TabPane, message } from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import {
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
} from '#/api/sys/dict';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import DictTypeModal from './modules/dict-type-modal.vue';
import DictDataModal from './modules/dict-data-modal.vue';

// ========== Tab State ==========
const activeTab = ref<'type' | 'data'>('type');

// ========== Modal Refs ==========
const typeModalVisible = ref(false);
const currentTypeId = ref<number>();
const dictTypeModalRef = ref<InstanceType<typeof DictTypeModal>>();
const dictDataModalRef = ref<InstanceType<typeof DictDataModal>>();
const dataModalVisible = ref(false);
const currentDataId = ref<number>();

// ========== Common State ==========
const exporting = ref(false);
const dictTypeOptions = ref<Array<{ label: string; value: string }>>([]);

// ========== Page Actions ==========
const pageActions = computed(() => [
  {
    label: activeTab.value === 'type' ? '新建类型' : '新建数据',
    type: 'primary' as const,
    icon: Plus,
    onClick: () => {
      if (activeTab.value === 'type') {
        handleAddType();
      } else {
        handleAddData();
      }
    },
  },
]);

// ========== Type List State ==========
const typeLoading = ref(false);
const typeTableData = ref<DictTypeResult[]>([]);
const selectedTypeRowKeys = ref<Array<number | string>>([]);

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

// ========== Data List State ==========
const dataLoading = ref(false);
const dataTableData = ref<DictDataResult[]>([]);
const selectedDataRowKeys = ref<Array<number | string>>([]);

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

// ========== Filter Fields ==========
const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const typeFilterFields = [
  { key: 'dictCode', label: '字典编码', type: 'input' as const },
  { key: 'dictName', label: '字典名称', type: 'input' as const },
];

const dataFilterFields = computed(() => [
  { key: 'dictType', label: '所属类型', type: 'select' as const, options: dictTypeOptions.value },
  { key: 'dictLabel', label: '字典标签', type: 'input' as const },
  { key: 'dictValue', label: '字典值', type: 'input' as const },
]);

// ========== Active Tab Computeds ==========
const activeQueryForm = computed(() => activeTab.value === 'type' ? queryTypeForm : queryDataForm);
const activeSearchKey = computed(() => activeTab.value === 'type' ? 'dictName' : 'dictLabel');
const activeSearchPlaceholder = computed(() => activeTab.value === 'type' ? '搜索字典名称...' : '搜索字典标签...');
const activeStorageKey = computed(() => activeTab.value === 'type' ? 'wms:filter:dict:type:activeFields' : 'wms:filter:dict:data:activeFields');
const activeDefaultFieldKeys = computed(() => activeTab.value === 'type' ? ['dictCode', 'dictName'] : ['dictType', 'dictLabel']);
const filterFields = computed(() => activeTab.value === 'type' ? typeFilterFields : dataFilterFields.value);
const activeLoading = computed(() => activeTab.value === 'type' ? typeLoading.value : dataLoading.value);
const activeTableData = computed(() => activeTab.value === 'type' ? typeTableData.value : dataTableData.value);
const activeSelectedRowKeys = computed(() => activeTab.value === 'type' ? selectedTypeRowKeys.value : selectedDataRowKeys.value);
const activePagination = computed(() => activeTab.value === 'type' ? typePagination : dataPagination);

// ========== Stats ==========
const typeEnabledCount = computed(() => typeTableData.value.filter((item) => item.isEnabled === 1).length);
const typeDisabledCount = computed(() => typeTableData.value.filter((item) => item.isEnabled === 0).length);
const typeCustomCount = computed(() => typeTableData.value.filter((item) => item.dictType === 'custom').length);
const dataEnabledCount = computed(() => dataTableData.value.filter((item) => item.isEnabled === 1).length);
const dataDisabledCount = computed(() => dataTableData.value.filter((item) => item.isEnabled === 0).length);
const dataTypeCount = computed(() => new Set(dataTableData.value.map((item) => item.dictType)).size);

const statsCards = computed(() => {
  if (activeTab.value === 'type') {
    return [
      { key: 'total', label: '字典类型', icon: BookTemplate, tone: 'blue' as const, value: typePagination.total || 0 },
      { key: 'enabled', label: '已启用', icon: Power, tone: 'green' as const, value: typeEnabledCount.value },
      { key: 'disabled', label: '已停用', icon: Ban, tone: 'orange' as const, value: typeDisabledCount.value },
      { key: 'custom', label: '自定义类型', icon: Star, tone: 'purple' as const, value: typeCustomCount.value },
    ];
  }
  return [
    { key: 'total', label: '字典数据', icon: List, tone: 'blue' as const, value: dataPagination.total || 0 },
    { key: 'enabled', label: '已启用', icon: Power, tone: 'green' as const, value: dataEnabledCount.value },
    { key: 'disabled', label: '已停用', icon: Ban, tone: 'orange' as const, value: dataDisabledCount.value },
    { key: 'type', label: '字典类型', icon: BookTemplate, tone: 'purple' as const, value: dataTypeCount.value },
  ];
});

// ========== Columns ==========
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

const activeColumns = computed(() => activeTab.value === 'type' ? typeColumns.value : dataColumns.value);

const activeRowSelection = computed(() => ({
  selectedRowKeys: activeSelectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    if (activeTab.value === 'type') {
      selectedTypeRowKeys.value = keys;
    } else {
      selectedDataRowKeys.value = keys;
    }
  },
}));

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
  if (tab === 'type') {
    loadTypeData();
  } else {
    loadDataData();
  }
}

function handleTableChange(page: TablePaginationConfig) {
  if (activeTab.value === 'type') {
    typePagination.current = page.current || 1;
    typePagination.pageSize = page.pageSize || 10;
    loadTypeData();
  } else {
    dataPagination.current = page.current || 1;
    dataPagination.pageSize = page.pageSize || 10;
    loadDataData();
  }
}

// ========== Type CRUD ==========
function handleAddType() {
  currentTypeId.value = undefined;
  typeModalVisible.value = true;
}

function handleEditType(record: DictTypeResult) {
  currentTypeId.value = record.id;
  dictTypeModalRef.value?.open(record.id!);
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
  dictDataModalRef.value?.open(record.id!);
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

// ========== Unified Handlers (active tab) ==========
function handleEdit(record: any) {
  if (activeTab.value === 'type') {
    handleEditType(record as DictTypeResult);
  } else {
    handleEditData(record as DictDataResult);
  }
}

async function handleDelete(record: any) {
  if (activeTab.value === 'type') {
    await handleDeleteType(record as DictTypeResult);
  } else {
    await handleDeleteData(record as DictDataResult);
  }
}

async function handleBatchDelete() {
  if (activeTab.value === 'type') {
    await handleBatchDeleteType();
  } else {
    await handleBatchDeleteData();
  }
}

async function handleToggleStatus(record: any, checked: boolean) {
  if (activeTab.value === 'type') {
    await handleToggleTypeStatus(record as DictTypeResult, checked);
  } else {
    await handleToggleDataStatus(record as DictDataResult, checked);
  }
}

// ========== Export ==========
async function handleExport() {
  exporting.value = true;
  try {
    const blob = activeTab.value === 'type'
      ? await exportDictType({
          dictCode: queryTypeForm.dictCode,
          dictName: queryTypeForm.dictName,
          isEnabled: queryTypeForm.isEnabled,
        })
      : await exportDictData({
          dictType: queryDataForm.dictType,
          dictLabel: queryDataForm.dictLabel,
          dictValue: queryDataForm.dictValue,
          isEnabled: queryDataForm.isEnabled,
        });
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
  loadTypeData();
});
</script>

<style scoped>
.dict-tabs-card {
  margin-top: 0;
}

.dict-tabs-card :deep(.ant-card-body) {
  padding: 0 0 0 0;
}

:deep(.ant-tabs-nav) {
  padding: 0 16px;
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
