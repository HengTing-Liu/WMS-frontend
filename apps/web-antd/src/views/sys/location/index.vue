<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_location"
    :page-title="$t('page.wms.location.listTitle')"
    :page-desc="$t('page.wms.location.listDescription')"
    :enable-selection="true"
    :show-table="viewMode === 'list'"
    crud-prefix="/api/wms/crud/inv_location"
    :default-sort="{ orderByColumn: 'locationSortNo', isAsc: 'asc' }"
    @form-success="handleFormSuccess"
    @selection-change="handleSelectionChange"
  >
    <template #toolbarLeft>
      <Button
        :type="viewMode === 'list' ? 'primary' : 'default'"
        @click="viewMode = 'list'"
      >
        <template #icon><IconifyIcon icon="material-symbols:format-list-bulleted" /></template>
        列表视图
      </Button>
      <Button
        :type="viewMode === 'hierarchy' ? 'primary' : 'default'"
        @click="switchToHierarchyView"
      >
        <template #icon><IconifyIcon icon="material-symbols:account-tree" /></template>
        层级视图
      </Button>
    </template>
    <template #toolbarExtra>
      <Button type="primary" @click="showStorageTypeModal = true">
        <template #icon><IconifyIcon icon="material-symbols:add" /></template>
        新建对象
      </Button>
      <Button v-if="viewMode === 'list' && !isContainerOrPosition" @click="handleAddStorageSection" :disabled="!canAddSection">
        <template #icon><IconifyIcon icon="material-symbols:playlist-add" /></template>
        新建分区
      </Button>
      <Button v-if="viewMode === 'list' && !isContainerOrPosition" @click="handleAddStorageContainer" :disabled="!canAddContainer">
        <template #icon><IconifyIcon icon="material-symbols:inventory-2" /></template>
        新建容器
      </Button>
      <Button @click="handleAssignWarehouse" :disabled="!selectedNodeId">
        <template #icon><IconifyIcon icon="material-symbols:warehouse" /></template>
        分配仓库
      </Button>
    </template>

    <!-- 行内操作列：预览、编辑、删除 -->
    <template #appendAction="{ record }">
      <Button
        type="link"
        size="small"
        class="p-0 action-icon-btn"
        @click="handlePreviewLocation(record)"
      >
        <template #icon><IconifyIcon icon="material-symbols:preview" class="text-lg" /></template>
      </Button>
      <Button
        type="link"
        size="small"
        class="p-0 action-icon-btn"
        @click="handleEditLocation(record)"
      >
        <template #icon><IconifyIcon icon="material-symbols:edit" class="text-lg" /></template>
      </Button>
      <Popconfirm
        :title="deleteConfirmTitle"
        ok-text="确认删除"
        cancel-text="取消"
        :disabled="!record.id"
        @confirm="handleDeleteLocation(record)"
      >
        <Button
          type="link"
          size="small"
          danger
          class="p-0 action-icon-btn"
          :loading="deletingIds.has(record.id)"
          :disabled="deleteLoadingIds.has(record.id)"
          @click.stop="checkBeforeDelete(record)"
        >
          <template #icon><IconifyIcon icon="material-symbols:delete" class="text-lg" /></template>
        </Button>
      </Popconfirm>
    </template>

    <!-- 层级视图内容（放在 LowcodePage content slot 中，替代数据表格区域） -->
    <template #content>
      <div v-if="viewMode === 'hierarchy'" class="hierarchy-view-container">
        <div class="hierarchy-header">
          <span class="hierarchy-title">库位层级结构</span>
          <div class="hierarchy-actions">
            <Button size="small" @click="expandAll">全部展示</Button>
            <Button size="small" @click="collapseAll">全部折叠</Button>
            <Button size="small" type="default" @click="viewMode = 'list'">返回列表</Button>
          </div>
        </div>
        <div v-if="hierarchyLoading" class="hierarchy-loading">
          <Spin />
        </div>
        <div v-else-if="hierarchyData.length === 0" class="hierarchy-empty">
          暂无数据
        </div>
        <div v-else class="location-hierarchy">
          <HierarchyNode
            v-for="root in hierarchyData"
            :key="root.id"
            :node="root"
            :level="0"
            @add-section="onHierarchyAddSection"
            @add-container="onHierarchyAddContainer"
            @edit="onHierarchyEdit"
            @delete="onHierarchyDelete"
            @assign-warehouse="onHierarchyAssignWarehouse"
          />
        </div>
      </div>
    </template>
  </LowcodePage>

  <!-- 新建存储对象弹窗 -->
  <StorageTypeModal
    v-model:visible="showStorageTypeModal"
    @success="handleStorageTypeSuccess"
  />

  <!-- 新建存储分区弹窗 -->
  <StorageSectionModal
    v-model:visible="showStorageSectionModal"
    :parent-id="selectedNodeId"
    :parent-location-name="selectedNodeName"
    :parent-warehouse-code="selectedWarehouseCode"
    @success="handleStorageSectionSuccess"
  />

  <!-- 新建存储容器弹窗 -->
  <StorageContainerModal
    v-model:visible="showStorageContainerModal"
    :parent-id="selectedNodeId"
    :parent-location-name="selectedNodeName"
    :parent-warehouse-code="selectedWarehouseCode"
    @success="handleStorageContainerSuccess"
  />

  <!-- 编辑库位弹窗 (Story 15-05) -->
  <LocationEditModal
    v-model:visible="showEditLocationModal"
    :record="selectedLocationRecord"
    @success="handleEditLocationSuccess"
  />

  <!-- 分配仓库弹窗 (Story 15-07) -->
  <AssignWarehouseModal
    ref="assignWarehouseModalRef"
    :location-id="selectedNodeId"
    :selected-container-ids="selectedContainerIds"
    @success="handleAssignWarehouseSuccess"
  />

  <!-- 库位预览弹窗 (Story 15-04) -->
  <LocationPreviewModal
    v-model:visible="showPreviewModal"
    :location-id="previewLocationId"
    :location-name="previewLocationName"
    :location-info="previewLocationInfo"
  />
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import { Button, Popconfirm, Modal, message, Spin } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import LowcodePage from '#/lowcode/LowcodePage.vue';
import HierarchyNode from './modules/HierarchyNode.vue';
import { getLocationTree } from '#/api/sys/location';
import { getDetail } from '#/api/wms/location';
import type { LocationTreeNode } from '#/api/sys/location';
import StorageTypeModal from '#/views/location/modules/storage-type-modal.vue';
import StorageSectionModal from '#/views/location/modules/storage-section-modal.vue';
import StorageContainerModal from '#/views/location/modules/storage-container-modal.vue';
import LocationEditModal from './modules/location-edit-modal.vue';
import LocationPreviewModal from './modules/location-preview-modal.vue';
import AssignWarehouseModal from '#/views/location/modules/assign-warehouse-modal.vue';
import { checkLocationCanDelete, deleteLocationRecursive } from '#/api/sys/location';
import { requestClient } from '#/api/request';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

// 视图切换
const viewMode = ref<'list' | 'hierarchy'>('list');

// 层级视图数据
const hierarchyLoading = ref(false);
const hierarchyData = ref<LocationTreeNode[]>([]);
const expandTick = ref(0);
const expandAllValue = ref(true);
provide('hierarchyExpand', { tick: expandTick, value: expandAllValue });

async function switchToHierarchyView() {
  viewMode.value = 'hierarchy';
  if (hierarchyData.value.length === 0) {
    await loadHierarchyData();
  }
}

async function loadHierarchyData() {
  hierarchyLoading.value = true;
  try {
    const data = await getLocationTree({ maxLevel: 5 });
    hierarchyData.value = Array.isArray(data) ? data : [];
  } catch (e) {
    hierarchyData.value = [];
  } finally {
    hierarchyLoading.value = false;
  }
}

function expandAll() {
  expandAllValue.value = true;
  expandTick.value++;
}

function collapseAll() {
  expandAllValue.value = false;
  expandTick.value++;
}

// 弹窗显示状态
const showStorageTypeModal = ref(false);
const showStorageSectionModal = ref(false);
const showStorageContainerModal = ref(false);

// 编辑库位相关（Story 15-05）
const showEditLocationModal = ref(false);
const selectedLocationRecord = ref<any>(null);

// 分配仓库相关（Story 15-07）
const assignWarehouseModalRef = ref<InstanceType<typeof AssignWarehouseModal> | null>(null);
const selectedContainerIds = ref<number[]>([]);

// 库位预览相关（Story 15-04）
const showPreviewModal = ref(false);
const previewLocationId = ref<number>();
const previewLocationName = ref('');
const previewLocationInfo = ref<any>({});

// 删除库位相关（Story 15-06）
const deleteConfirmTitle = ref('确定要删除该库位及下级所有库位吗？删除后数据不可恢复。');
const deleteLoadingIds = ref(new Set<number>());
const deletingIds = ref(new Set<number>());
const pendingDeleteRecord = ref<any>(null);

// 选中节点信息（实际应从树形组件获取）
const selectedNodeId = ref<number | null>(null);
const selectedNodeName = ref('');
const selectedWarehouseCode = ref('');
const selectedLocationGrade = ref<string | null>(null);
// 选中节点下"存储分区"子节点数：>0 则不能再新建容器
const selectedNodeChildCount = ref<number>(0);
// 选中节点下"存储容器"子节点数：>0 则不能再新建分区（不允许分区与容器混挂同一父节点）
const selectedNodeContainerCount = ref<number>(0);
const selectedNodeChildCountLoading = ref(false);
// 列表中被勾选的行数；新建分区/新建容器要求只能勾选 1 行才允许操作（多选时置灰）
const selectedRowCount = ref<number>(0);
const isSingleSelection = computed(
  () => selectedRowCount.value === 1 && !!selectedNodeId.value,
);

// 库位等级常量
const LOCATION_GRADE = {
  TYPE: 'Type', // 存储对象
  TYPE_SECTION: 'TypeSection', // 存储分区
  CONTAINER: 'Container', // 存储容器
  CONTAINER_POSITION: 'ContainerPosition', // 存储孔位
} as const;

// 并行统计选中节点的子节点情况，用于工具栏按钮使能判断：
// - sectionCount：下级"存储分区"数量，>0 则不能再加容器（避免"分区 + 容器"混挂）
// - containerCount：下级"存储容器"数量，>0 则不能再加分区（同上，避免混挂）
async function checkSelectedNodeChildCount(nodeId: number) {
  selectedNodeChildCountLoading.value = true;
  const fetchCount = async (values: string[]) => {
    try {
      const n = await requestClient.get<number>('/api/wms/crud/inv_location/tree/count', {
        params: {
          parentColumn: 'parent_id',
          parentValue: nodeId,
          filterColumn: 'location_grade',
          filterValues: values,
        },
        paramsSerializer: { indexes: null },
      });
      return typeof n === 'number' ? n : 0;
    } catch {
      return 0;
    }
  };
  try {
    const [sectionCount, containerCount] = await Promise.all([
      fetchCount(['StorageSection', '存储分区']),
      fetchCount(['Container', '存储容器']),
    ]);
    selectedNodeChildCount.value = sectionCount;
    selectedNodeContainerCount.value = containerCount;
  } finally {
    selectedNodeChildCountLoading.value = false;
  }
}

// 当前选中节点是否为存储容器或存储孔位
const isContainerOrPosition = computed(() => {
  if (!selectedLocationGrade.value) return false;
  return ['Container', '存储容器', 'ContainerPosition', '存储孔位'].includes(selectedLocationGrade.value);
});

// 新建容器按钮可用条件：单选一行"存储分区"且其下没有"存储分区"子节点
// 注意：DB 里 location_grade 历史值可能是英文枚举 'StorageSection' 或中文 '存储分区'，此处两者都兼容。
// selectedNodeChildCount 来自 /tree/count 接口，已按 location_grade IN (StorageSection,存储分区) 过滤，
// 已有的容器/孔位不会被计入，因此同一个末级分区可以继续新增多个容器。
const SECTION_GRADES = ['StorageSection', '存储分区'];
const canAddContainer = computed(() => {
  if (!isSingleSelection.value) return false;
  if (!SECTION_GRADES.includes(selectedLocationGrade.value || '')) return false;
  return selectedNodeChildCount.value === 0;
});

// 新建分区按钮可用条件：单选一行 + 该行下未出现"存储容器"子节点
// 避免在同一父节点下混挂"存储分区"和"存储容器"。
const canAddSection = computed(() => {
  if (!isSingleSelection.value) return false;
  return selectedNodeContainerCount.value === 0;
});

// 新建存储对象成功
function handleStorageTypeSuccess() {
  message.success('新建存储对象成功');
  lowcodePageRef.value?.reload();
  if (viewMode.value === 'hierarchy') {
    loadHierarchyData();
  }
}

// 新建存储分区
function handleAddStorageSection() {
  if (!selectedNodeId.value) {
    message.warning('请先在列表中选择一个库位');
    return;
  }
  showStorageSectionModal.value = true;
}

// 新建存储分区成功
function handleStorageSectionSuccess() {
  message.success('新建存储分区成功');
  lowcodePageRef.value?.reload();
  if (viewMode.value === 'hierarchy') {
    loadHierarchyData();
  }
}

// 新建存储容器
function handleAddStorageContainer() {
  if (!selectedNodeId.value) {
    message.warning('请先在列表中选择一个库位');
    return;
  }
  showStorageContainerModal.value = true;
}

// 新建存储容器成功
function handleStorageContainerSuccess() {
  message.success('新建存储容器成功');
  lowcodePageRef.value?.reload();
  if (viewMode.value === 'hierarchy') {
    loadHierarchyData();
  }
}

// 层级视图：节点上点击新建分区
function onHierarchyAddSection(node: LocationTreeNode) {
  selectedNodeId.value = node.id ?? null;
  selectedNodeName.value = node.locationName ?? '';
  selectedWarehouseCode.value = node.warehouseCode ?? '';
  selectedLocationGrade.value = node.locationGrade ?? null;
  showStorageSectionModal.value = true;
}

// 层级视图：节点上点击新建容器
function onHierarchyAddContainer(node: LocationTreeNode) {
  selectedNodeId.value = node.id ?? null;
  selectedNodeName.value = node.locationName ?? '';
  selectedWarehouseCode.value = node.warehouseCode ?? '';
  selectedLocationGrade.value = node.locationGrade ?? null;
  showStorageContainerModal.value = true;
}

// 层级视图：节点上点击编辑
function onHierarchyEdit(node: LocationTreeNode) {
  selectedLocationRecord.value = node;
  showEditLocationModal.value = true;
}

// 层级视图：节点上点击删除
async function onHierarchyDelete(node: LocationTreeNode) {
  if (!node.id) {
    message.warning('记录ID不存在');
    return;
  }
  deleteLoadingIds.value.add(node.id);
  try {
    const result = await checkLocationCanDelete(node.id);
    if (!result.canDelete) {
      message.warning(result.message || '该库位已被占用，无法删除');
      return;
    }
    const childCount = result.childCount || 0;
    const title = childCount > 0
      ? `确定要删除该库位及下级所有库位吗（共${childCount}个下级库位）？删除后数据不可恢复。`
      : '确定要删除该库位吗？删除后数据不可恢复。';

    Modal.confirm({
      title,
      okText: '确认删除',
      cancelText: '取消',
      async onOk() {
        deletingIds.value.add(node.id!);
        try {
          await deleteLocationRecursive(node.id!);
          message.success('删除成功');
          lowcodePageRef.value?.reload();
          if (viewMode.value === 'hierarchy') {
            await loadHierarchyData();
          }
        } catch (error: any) {
          message.error(error?.message || '删除失败');
        } finally {
          deletingIds.value.delete(node.id!);
        }
      },
    });
  } catch (error: any) {
    message.error(error?.message || '检查删除状态失败');
  } finally {
    deleteLoadingIds.value.delete(node.id);
  }
}

// 层级视图：节点上点击分配仓库
function onHierarchyAssignWarehouse(node: LocationTreeNode) {
  selectedNodeId.value = node.id ?? null;
  selectedContainerIds.value = [];
  assignWarehouseModalRef.value?.open();
}

// 编辑库位 (Story 15-05)
async function handleEditLocation(record: any) {
  selectedLocationRecord.value = record;
  showEditLocationModal.value = true;
}

// 编辑库位成功
function handleEditLocationSuccess() {
  message.success('编辑库位成功');
  lowcodePageRef.value?.reload();
}

// 删除库位前检查（Story 15-06）
async function checkBeforeDelete(record: any) {
  if (!record?.id) {
    message.warning('记录ID不存在');
    return;
  }

  deleteLoadingIds.value.add(record.id);
  try {
    const result = await checkLocationCanDelete(record.id);
    if (!result.canDelete) {
      message.warning(result.message || '该库位已被占用，无法删除');
      return;
    }
    // 可以删除，更新确认提示信息
    const childCount = result.childCount || 0;
    if (childCount > 0) {
      deleteConfirmTitle.value = `确定要删除该库位及下级所有库位吗（共${childCount}个下级库位）？删除后数据不可恢复。`;
    } else {
      deleteConfirmTitle.value = '确定要删除该库位吗？删除后数据不可恢复。';
    }
    pendingDeleteRecord.value = record;
  } catch (error: any) {
    message.error(error?.message || '检查删除状态失败');
  } finally {
    deleteLoadingIds.value.delete(record.id);
  }
}

// 执行删除（Story 15-06）
async function handleDeleteLocation(record: any) {
  if (!record?.id) {
    message.warning('记录ID不存在');
    return;
  }

  deletingIds.value.add(record.id);
  try {
    await deleteLocationRecursive(record.id);
    message.success('删除成功');
    lowcodePageRef.value?.reload();
    if (viewMode.value === 'hierarchy') {
      loadHierarchyData();
    }
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deletingIds.value.delete(record.id);
  }
}

function handleFormSuccess() {
  lowcodePageRef.value?.reload();
}

// 分配仓库 (Story 15-07)
function handleAssignWarehouse() {
  if (!selectedNodeId.value) {
    message.warning('请先在列表中选择一个库位');
    return;
  }
  selectedContainerIds.value = [];
  assignWarehouseModalRef.value?.open();
}

// 分配仓库成功
function handleAssignWarehouseSuccess() {
  message.success('分配仓库成功');
  lowcodePageRef.value?.reload();
}

// 库位预览 (Story 15-04)
function handlePreviewLocation(record: any) {
  previewLocationId.value = record.id;
  previewLocationName.value = record.locationName;
  previewLocationInfo.value = record;
  showPreviewModal.value = true;
}

// 选中项变化
async function handleSelectionChange(keys: any[], records?: any[]) {
  selectedRowCount.value = keys.length;
  if (keys.length > 0) {
    selectedNodeId.value = keys[0];
    // 保存选中记录的 locationGrade
    if (records && records.length > 0) {
      const selectedRecord = records[0];
      if (selectedRecord?.locationGrade) {
        // 优先使用 records 中的 locationGrade
        selectedLocationGrade.value = selectedRecord.locationGrade;
        selectedNodeName.value = selectedRecord?.locationName ?? '';
        selectedWarehouseCode.value = selectedRecord?.warehouseCode ?? '';
        checkSelectedNodeChildCount(keys[0]);
      } else {
        // records 中没有 locationGrade，通过 getDetail API 获取
        try {
          const detail = await getDetail(keys[0]);
          selectedLocationGrade.value = detail?.locationGrade ?? null;
          selectedNodeName.value = detail?.locationName ?? '';
          selectedWarehouseCode.value = detail?.warehouseCode ?? '';
        } catch {
          selectedLocationGrade.value = null;
          selectedNodeName.value = selectedRecord?.locationName ?? '';
          selectedWarehouseCode.value = selectedRecord?.warehouseCode ?? '';
        }
        checkSelectedNodeChildCount(keys[0]);
      }
    } else {
      // records 为空，直接通过 getDetail 获取
      try {
        const detail = await getDetail(keys[0]);
        selectedLocationGrade.value = detail?.locationGrade ?? null;
        selectedNodeName.value = detail?.locationName ?? '';
        selectedWarehouseCode.value = detail?.warehouseCode ?? '';
      } catch {
        selectedLocationGrade.value = null;
      }
      checkSelectedNodeChildCount(keys[0]);
    }
  } else {
    selectedNodeId.value = null;
    selectedLocationGrade.value = null;
    selectedNodeName.value = '';
    selectedWarehouseCode.value = '';
    selectedNodeChildCount.value = 0;
    selectedNodeContainerCount.value = 0;
  }
}
</script>

<style scoped>
.action-icon-btn :deep(.ant-btn-link-content) {
  font-size: 0;
}

.hierarchy-view-container {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 16px;
  margin-top: 16px;
}

.hierarchy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.hierarchy-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.hierarchy-actions {
  display: flex;
  gap: 8px;
}

.hierarchy-loading,
.hierarchy-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #8c8c8c;
}

.location-hierarchy {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 16px;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}
</style>