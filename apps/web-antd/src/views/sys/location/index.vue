<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_location"
    :page-title="$t('page.wms.location.listTitle')"
    :page-desc="$t('page.wms.location.listDescription')"
    :enable-selection="true"
    crud-prefix="/api/wms/crud/inv_location"
    @form-success="handleFormSuccess"
    @selection-change="handleSelectionChange"
  >
    <template #toolbarExtra>
      <Button type="primary" @click="showStorageTypeModal = true">
        <template #icon><IconifyIcon icon="material-symbols:add" /></template>
        新建对象
      </Button>
      <Button @click="handleAddStorageSection" :disabled="!selectedNodeId">
        <template #icon><IconifyIcon icon="material-symbols:playlist-add" /></template>
        新建分区
      </Button>
      <Button @click="handleAddStorageContainer" :disabled="!selectedNodeId">
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
import { ref, computed } from 'vue';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import LowcodePage from '#/lowcode/LowcodePage.vue';
import StorageTypeModal from '#/views/location/modules/storage-type-modal.vue';
import StorageSectionModal from '#/views/location/modules/storage-section-modal.vue';
import StorageContainerModal from '#/views/location/modules/storage-container-modal.vue';
import LocationEditModal from './modules/location-edit-modal.vue';
import LocationPreviewModal from './modules/location-preview-modal.vue';
import AssignWarehouseModal from '#/views/location/modules/assign-warehouse-modal.vue';
import { checkLocationCanDelete, deleteLocationRecursive } from '#/api/sys/location';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

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

// 新建存储对象成功
function handleStorageTypeSuccess() {
  message.success('新建存储对象成功');
  lowcodePageRef.value?.reload();
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

// 执行删���（Story 15-06）
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
function handleSelectionChange(keys: any[]) {
  if (keys.length > 0) {
    selectedNodeId.value = keys[0];
  }
}
</script>

<style scoped>
.action-icon-btn :deep(.ant-btn-link-content) {
  font-size: 0;
}
</style>