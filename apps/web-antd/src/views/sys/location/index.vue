<template>
  <WmsPageLayout
    :title="$t('page.wms.location.listTitle')"
    :description="$t('page.wms.location.listDescription')"
    :actions="pageActions"
  >
    <template #default>
      <div class="location-tree-layout">
        <!-- 左侧：仓库选择 + 库位树 -->
        <div class="location-tree-panel">
          <!-- 仓库选择器 -->
          <div class="warehouse-selector">
            <Select
              v-model:value="selectedWarehouseCode"
              :options="warehouseOptions"
              :placeholder="$t('page.wms.location.selectWarehouse')"
              :loading="warehouseLoading"
              allow-clear
              class="warehouse-select"
              @change="handleWarehouseChange"
            />
          </div>

          <!-- 库位树 -->
          <div class="tree-container">
            <Spin :spinning="treeLoading">
              <Tree
                v-if="!treeLoading && selectedWarehouseCode"
                v-model:expandedKeys="expandedKeys"
                :tree-data="treeData"
                :load-data="onLoadData"
                :selected-keys="selectedKeys"
                :show-icon="true"
                :show-line="{ showLeafIcon: false }"
                :selected="true"
                class="location-tree"
                @select="handleTreeSelect"
              >
                <template #icon>
                  <MapPin :size="14" />
                </template>
                <template #title="{ dataRef }">
                  <div class="tree-node-content">
                    <span class="tree-node-name" :title="dataRef.locationName">
                      {{ dataRef.locationName }}
                    </span>
                    <span class="tree-node-code">({{ dataRef.locationNo }})</span>
                    <Tag
                      v-if="dataRef.locationType"
                      size="small"
                      :color="getLocationTypeColor(dataRef.locationType)"
                    >
                      {{ formatLocationType(dataRef.locationType) }}
                    </Tag>
                    <Tag v-if="dataRef.isUse === 1" size="small" color="orange">
                      {{ $t('page.wms.location.occupied') }}
                    </Tag>
                  </div>
                </template>
              </Tree>
              <Empty
                v-else-if="!treeLoading && !selectedWarehouseCode"
                :description="$t('page.wms.location.selectWarehouseTip')"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
              <Empty
                v-else-if="!treeLoading && selectedWarehouseCode && treeData.length === 0"
                :description="$t('page.wms.location.emptyTree')"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </Spin>
          </div>
        </div>

        <!-- 右侧：工具栏 + 表格 -->
        <div class="location-detail-panel">
          <!-- 统计卡片 -->
          <div class="detail-stats">
            <WmsStatsCards :items="detailStats" />
          </div>

          <!-- 搜索过滤 -->
          <div class="detail-filter">
            <WmsFilterBar
              :query="queryForm"
              search-key="keyword"
              :search-placeholder="$t('page.wms.location.searchPlaceholder')"
              status-key="isUse"
              :status-options="statusFilterOptions"
              :fields="filterFields"
              storage-key="wms:filter:location-detail:activeFields"
              :default-field-keys="['keyword']"
              @search="handleDetailSearch"
            >
              <template #actions>
                <Space>
                  <Button :loading="exporting" @click="handleExport">
                    <template #icon><Download /></template>
                    {{ $t('page.wms.location.export') }}
                  </Button>
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
            </WmsFilterBar>
          </div>

          <!-- 库位列表 -->
          <WmsDataTable
            row-key="id"
            :loading="detailLoading"
            :columns="detailColumns"
            :data-source="tableData"
            :pagination="pagination"
            :row-selection="rowSelection"
            :scroll="{ x: 1200 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'locationType'">
                <Tag :color="getLocationTypeColor(record.locationType)">
                  {{ formatLocationType(record.locationType) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'isUse'">
                <Tag :color="record.isUse === 1 ? 'orange' : 'green'">
                  {{ record.isUse === 1 ? $t('page.wms.location.occupied') : $t('page.wms.location.idle') }}
                </Tag>
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
        </div>
      </div>
    </template>
  </WmsPageLayout>

  <!-- 新增/编辑弹窗 -->
  <LocationModal
    ref="locationModalRef"
    v-model:visible="modalVisible"
    :mode="modalMode"
    :record="currentRecord"
    :warehouse-options="warehouseOptions"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Plus, Download, MapPin, Package } from 'lucide-vue-next';
import {
  Button,
  Popconfirm,
  Space,
  Tag,
  Select,
  Tree,
  Spin,
  Empty,
  message,
} from 'ant-design-vue';
import type { TreeDataItem } from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { $t } from '@vben/locales';
import {
  listWarehouseSimple,
  listLocationPage,
  exportLocation,
  deleteLocation,
  getLocationTree,
  getLocationChildren,
  createLocationWithParent,
  updateLocationById,
  deleteLocationById,
  type LocationTreeNode,
  type LocationTreeQuery,
  type LocationQuery,
  type LocationResult,
} from '#/api/sys/location';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';
import LocationModal from './modules/location-modal.vue';

// ========== 仓库选择 ==========
const warehouseOptions = ref<Array<{ label: string; value: string }>>([]);
const warehouseLoading = ref(false);
const selectedWarehouseCode = ref<string>();

// ========== 库位树 ==========
const treeLoading = ref(false);
const treeData = ref<LocationTreeNode[]>([]);
const expandedKeys = ref<number[]>([]);
const selectedKeys = ref<number[]>([]);
const currentParentId = ref<number | undefined>();

// ========== 列表 ==========
const detailLoading = ref(false);
const exporting = ref(false);
const tableData = ref<LocationResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const searchKeyword = ref('');

const queryForm = reactive({
  keyword: '',
  isUse: undefined as number | undefined,
});

// ========== 分页 ==========
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

// ========== 弹窗 ==========
const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<LocationTreeNode | null>(null);
const locationModalRef = ref();

// ========== 页面动作 ==========
const pageActions = computed(() => [
  {
    label: $t('page.wms.location.add'),
    type: 'primary' as const,
    icon: Plus,
    disabled: !selectedWarehouseCode.value,
    onClick: handleAdd,
  },
]);

// ========== 过滤选项 ==========
const locationTypeOptions = [
  { label: $t('page.wms.location.locationTypeOptions.STORAGE'), value: 'STORAGE' },
  { label: $t('page.wms.location.locationTypeOptions.PICK'), value: 'PICK' },
  { label: $t('page.wms.location.locationTypeOptions.COLLECT'), value: 'COLLECT' },
  { label: $t('page.wms.location.locationTypeOptions.RETURN'), value: 'RETURN' },
];

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.location.statusOptions.all'), value: undefined },
  { label: $t('page.wms.location.statusOptions.occupied'), value: 1 },
  { label: $t('page.wms.location.statusOptions.idle'), value: 0 },
]);

const filterFields = computed(() => [
  { key: 'keyword', label: $t('page.wms.location.filter.keyword'), type: 'input' as const },
  { key: 'locationType', label: $t('page.wms.location.filter.locationType'), type: 'select' as const, options: locationTypeOptions },
]);

// ========== 统计 ==========
const totalCount = computed(() => pagination.total || 0);
const occupiedCount = computed(() => tableData.value.filter((r) => r.isUse === 1).length);
const idleCount = computed(() => tableData.value.filter((r) => r.isUse === 0).length);

const detailStats = computed(() => [
  { key: 'total', label: $t('page.wms.location.stats.total'), icon: MapPin, tone: 'blue' as const, value: totalCount.value },
  { key: 'occupied', label: $t('page.wms.location.stats.occupied'), icon: Package, tone: 'orange' as const, value: occupiedCount.value },
  { key: 'idle', label: $t('page.wms.location.stats.idle'), icon: MapPin, tone: 'green' as const, value: idleCount.value },
]);

// ========== 表格列 ==========
const detailColumns = computed<TableColumnsType<LocationResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 20) + index + 1}` },
  { title: $t('page.wms.location.columns.locationNo'), dataIndex: 'locationNo', key: 'locationNo', width: 160 },
  { title: $t('page.wms.location.columns.locationName'), dataIndex: 'locationName', key: 'locationName', width: 180 },
  { title: $t('page.wms.location.columns.locationType'), dataIndex: 'locationType', key: 'locationType', width: 120 },
  { title: $t('page.wms.location.columns.storageMode'), dataIndex: 'storageMode', key: 'storageMode', width: 120 },
  { title: $t('page.wms.location.columns.isUse'), dataIndex: 'isUse', key: 'isUse', width: 100 },
  { title: $t('page.common.remark'), dataIndex: 'remarks', key: 'remarks', ellipsis: true },
  { title: $t('page.common.operation'), key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

// ========== 加载仓库列表 ==========
async function loadWarehouseOptions() {
  warehouseLoading.value = true;
  try {
    const list = await listWarehouseSimple();
    warehouseOptions.value = list.map((r: any) => ({
      label: typeof r === 'string' ? r : (r.label ?? r.warehouseName ?? r.warehouseCode),
      value: r.value ?? r.warehouseCode ?? r,
    }));
  } catch {
    warehouseOptions.value = [];
  } finally {
    warehouseLoading.value = false;
  }
}

// ========== 加载库位树 ==========
async function loadLocationTree() {
  if (!selectedWarehouseCode.value) {
    treeData.value = [];
    return;
  }
  treeLoading.value = true;
  try {
    const nodes = await getLocationTree({ warehouseCode: selectedWarehouseCode.value });
    treeData.value = buildTree(nodes, undefined);
  } catch (e: any) {
    treeData.value = [];
    message.error($t('page.wms.location.messages.treeLoadFail'));
  } finally {
    treeLoading.value = false;
  }
}

function buildTree(nodes: LocationTreeNode[], parentId: number | undefined): LocationTreeNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .map((n) => ({
      ...n,
      children: n.hasChildren ? undefined : buildTree(nodes, n.id),
      hasChildren: undefined,
    }));
}

// 懒加载子节点
async function onLoadData(treeNode: TreeDataItem): Promise<void> {
  const nodeId = treeNode.id as number;
  if (treeNode.children && treeNode.children.length > 0) return;
  try {
    const children = await getLocationChildren(nodeId);
    const parent = findTreeNode(treeData.value, nodeId);
    if (parent) {
      parent.children = buildTree(children, nodeId);
    }
  } catch (e: any) {
    message.error($t('page.wms.location.messages.childrenLoadFail'));
  }
}

function findTreeNode(nodes: LocationTreeNode[], id: number): LocationTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findTreeNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ========== 加载库位列表（右侧） ==========
async function loadDetailData() {
  if (!selectedWarehouseCode.value) return;
  detailLoading.value = true;
  try {
    const res = await listLocationPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
      warehouseId: undefined,
      locationCode: searchKeyword.value || undefined,
      locationName: searchKeyword.value || undefined,
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch {
    tableData.value = [];
    pagination.total = 0;
  } finally {
    detailLoading.value = false;
  }
}

// ========== 事件处理 ==========
function handleWarehouseChange() {
  treeData.value = [];
  expandedKeys.value = [];
  selectedKeys.value = [];
  currentParentId.value = undefined;
  pagination.current = 1;
  tableData.value = [];
  selectedRowKeys.value = [];
  if (selectedWarehouseCode.value) {
    loadLocationTree();
    loadDetailData();
  }
}

function handleTreeSelect(keys: number[]) {
  selectedKeys.value = keys;
  currentParentId.value = keys[0];
  pagination.current = 1;
  loadDetailData();
}

function handleDetailSearch() {
  pagination.current = 1;
  searchKeyword.value = queryForm.keyword;
  loadDetailData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 20;
  loadDetailData();
}

function handleAdd() {
  modalMode.value = 'add';
  currentRecord.value = null;
  modalVisible.value = true;
}

function handleEdit(record: LocationResult) {
  modalMode.value = 'edit';
  currentRecord.value = record as unknown as LocationTreeNode;
  modalVisible.value = true;
}

async function handleDelete(record: LocationResult) {
  try {
    await deleteLocationById(record.id!);
    message.success($t('page.wms.location.messages.deleteSuccess'));
    await loadLocationTree();
    await loadDetailData();
  } catch (e: any) {
    message.error(e?.message || $t('page.wms.location.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) return;
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteLocationById(Number(id))));
    message.success($t('page.wms.location.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    await loadLocationTree();
    await loadDetailData();
  } catch (e: any) {
    message.error(e?.message || $t('page.wms.location.messages.batchDeleteFail'));
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportLocation({
      warehouseCode: selectedWarehouseCode.value,
      locationCode: searchKeyword.value || undefined,
      locationName: searchKeyword.value || undefined,
    } as any);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `库位档案_${selectedWarehouseCode.value}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.location.messages.exportSuccess'));
  } catch (e: any) {
    message.error(e?.message || $t('page.wms.location.messages.exportFail'));
  } finally {
    exporting.value = false;
  }
}

async function handleModalSuccess() {
  await loadLocationTree();
  await loadDetailData();
}

function formatLocationType(value?: string) {
  return locationTypeOptions.find((item) => item.value === value)?.label || value || '-';
}

function getLocationTypeColor(type?: string) {
  const colorMap: Record<string, string> = {
    STORAGE: 'blue',
    PICK: 'green',
    COLLECT: 'purple',
    RETURN: 'orange',
  };
  return colorMap[type ?? ''] ?? 'default';
}

// ========== 初始化 ==========
onMounted(() => {
  loadWarehouseOptions();
});
</script>

<style scoped>
.location-tree-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.location-tree-panel {
  width: 280px;
  min-width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.warehouse-selector {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color-light);
}

.warehouse-select {
  width: 100%;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.location-tree {
  background: transparent;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tree-node-name {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-code {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.location-detail-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-stats {
  flex-shrink: 0;
}

.detail-filter {
  flex-shrink: 0;
}
</style>
