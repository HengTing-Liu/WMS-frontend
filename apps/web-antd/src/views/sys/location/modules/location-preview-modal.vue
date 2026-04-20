<template>
  <Modal
    v-model:open="visible"
    title="库位预览"
    :footer="null"
    width="900px"
  >
    <template v-if="loading">
      <div class="flex justify-center items-center" style="height: 200px">
        <Spin />
      </div>
    </template>
    <template v-else>
      <!-- 仓库信息 -->
      <div class="info-section" v-if="warehouseInfo">
        <div class="section-title">
          <IconifyIcon icon="material-symbols:warehouse" class="title-icon" />
          <span>仓库信息</span>
        </div>
        <Descriptions :column="3" bordered size="small" class="info-descriptions">
          <DescriptionsItem label="仓库编码">{{ warehouseInfo.warehouseCode || '-' }}</DescriptionsItem>
          <DescriptionsItem label="仓库名称">{{ warehouseInfo.warehouseName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="仓库类型">{{ warehouseInfo.warehouseType || '-' }}</DescriptionsItem>
          <DescriptionsItem label="ERP公司名称">{{ warehouseInfo.erpCompanyName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="所在地">{{ warehouseInfo.warehouseLocation || '-' }}</DescriptionsItem>
          <DescriptionsItem label="温度分区">{{ warehouseInfo.temperatureZone || '-' }}</DescriptionsItem>
          <DescriptionsItem label="质量分区">{{ warehouseInfo.qualityZone || '-' }}</DescriptionsItem>
          <DescriptionsItem label="责任人">{{ warehouseInfo.employeeName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="责任部门">{{ warehouseInfo.deptNameFullPath || '-' }}</DescriptionsItem>
        </Descriptions>
      </div>

      <!-- 库位基本信息 -->
      <div class="info-section">
        <div class="section-title">
          <IconifyIcon icon="material-symbols:location-on" class="title-icon" />
          <span>库位信息</span>
        </div>
        <Descriptions :column="3" bordered size="small" class="info-descriptions">
          <DescriptionsItem label="ID">{{ locationInfo.id || '-' }}</DescriptionsItem>
          <DescriptionsItem label="库位名称">{{ locationInfo.locationName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="库位类型">{{ locationInfo.locationType || '-' }}</DescriptionsItem>
          <DescriptionsItem label="层级">{{ locationInfo.locationLevel || '-' }}</DescriptionsItem>
          <DescriptionsItem label="总层数">{{ locationInfo.locationLevelCount || '-' }}</DescriptionsItem>
          <DescriptionsItem label="等级">{{ getGradeText(locationInfo.locationGrade) }}</DescriptionsItem>
          <DescriptionsItem label="上级ID">{{ locationInfo.parentId || '-' }}</DescriptionsItem>
          <DescriptionsItem label="上级名称">{{ locationInfo.parentName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="存储模式">{{ getStorageModeText(locationInfo.storageMode) }}</DescriptionsItem>
          <DescriptionsItem label="同级序号">{{ locationInfo.internalSerialNo || '-' }}</DescriptionsItem>
          <DescriptionsItem label="同级总数">{{ locationInfo.internalQuantity || '-' }}</DescriptionsItem>
          <DescriptionsItem label="规格">{{ locationInfo.specification || '-' }}</DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="locationInfo.isUse === 1 ? 'error' : 'success'">
              {{ locationInfo.isUse === 1 ? '占用' : '空闲' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="库位编码" :span="5">{{ locationInfo.locationSortNo || '-' }}</DescriptionsItem>
          <DescriptionsItem label="全路径名称" :span="5">{{ locationInfo.locationFullpathName || '-' }}</DescriptionsItem>
        </Descriptions>
      </div>

      <!-- 系统信息 -->
      <div class="system-info-section">
        <div class="section-title">
          <IconifyIcon icon="material-symbols:settings" class="title-icon" />
          <span>系统信息</span>
        </div>
        <Descriptions :column="3" bordered size="small" class="system-descriptions">
          <DescriptionsItem label="是否删除">
            <Tag :color="locationInfo.isDeleted === 1 ? 'error' : 'default'">
              {{ locationInfo.isDeleted === 1 ? '已删除' : '正常' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="备注" :span="2">{{ locationInfo.remarks || '-' }}</DescriptionsItem>
          <DescriptionsItem label="创建人">{{ locationInfo.createBy || '-' }}</DescriptionsItem>
          <DescriptionsItem label="创建时间">{{ locationInfo.createTime || '-' }}</DescriptionsItem>
          <DescriptionsItem label="更新人">{{ locationInfo.updateBy || '-' }}</DescriptionsItem>
          <DescriptionsItem label="更新时间">{{ locationInfo.updateTime || '-' }}</DescriptionsItem>
        </Descriptions>
      </div>

      <!-- 子节点层级结构 -->
      <div v-if="children.length > 0">
        <div class="hierarchy-header">
          <span class="hierarchy-title">库位层级结构</span>
          <div class="hierarchy-actions">
            <Button size="small" @click="expandAllValue = true; expandTick++">全部展示</Button>
            <Button size="small" @click="expandAllValue = false; expandTick++">全部折叠</Button>
          </div>
        </div>
        <div class="location-hierarchy">
          <HierarchyNode
            v-for="root in children"
            :key="root.id"
            :node="root"
            :level="0"
          />
        </div>
      </div>

      <div v-else class="text-center text-gray-400 py-8">
        暂无子节点
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue';
import { Descriptions, DescriptionsItem, Divider, Modal, Spin, Tag, Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { getChildren } from '#/api/wms/location';
import HierarchyNode from './HierarchyNode.vue';
import { getWarehouseByCode } from '#/api/sys/warehouse';
import type { LocationTreeNode } from '#/api/wms/location';
import type { WarehouseResult } from '#/api/sys/warehouse';

interface Props {
  visible: boolean;
  locationId?: number;
  locationName?: string;
  locationInfo?: LocationTreeNode;
}

const props = withDefaults(defineProps<Props>(), {
  locationId: undefined,
  locationName: '',
  locationInfo: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const loading = ref(false);
const children = ref<LocationTreeNode[]>([]);
const warehouseInfo = ref<WarehouseResult | null>(null);
const expandTick = ref(0);
const expandAllValue = ref(true);
provide('hierarchyExpand', { tick: expandTick, value: expandAllValue });

function getGradeText(grade?: string): string {
  const textMap: Record<string, string> = {
    StorageType: '存储对象',
    Type: '存储对象',
    存储对象: '存储对象',
    StorageSection: '存储分区',
    TypeSection: '存储分区',
    存储分区: '存储分区',
    Container: '存储容器',
    存储容器: '存储容器',
    ContainerPosition: '存储孔位',
    存储孔位: '存储孔位',
  };
  return textMap[grade || ''] || grade || '';
}

function getStorageModeText(mode?: string): string {
  const textMap: Record<string, string> = {
    Exclusive: '独占模式',
    Shared: '共享模式',
  };
  return textMap[mode || ''] || mode || '-';
}

async function loadData() {
  if (!props.locationId) {
    children.value = [];
    warehouseInfo.value = null;
    return;
  }

  loading.value = true;
  try {
    const res = await getChildren(props.locationId);
    let rawData: LocationTreeNode[] = [];
    if (res?.code === 200) {
      rawData = res.data || [];
    } else if (Array.isArray(res)) {
      rawData = res;
    }

    children.value = rawData;

    // 根据仓库编码加载仓库信息
    if (props.locationInfo?.warehouseCode) {
      const warehouse = await getWarehouseByCode(props.locationInfo.warehouseCode);
      warehouseInfo.value = warehouse;
    }
  } catch (error) {
    console.error('加载库位预览数据失败:', error);
    children.value = [];
    warehouseInfo.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadData();
    }
  },
);

watch(
  () => props.locationId,
  () => {
    if (props.visible) {
      loadData();
    }
  },
);

watch(
  () => props.locationInfo?.warehouseCode,
  (newCode, oldCode) => {
    if (newCode && newCode !== oldCode && props.visible) {
      getWarehouseByCode(newCode).then((warehouse) => {
        warehouseInfo.value = warehouse;
      });
    }
  },
);
</script>

<style scoped>
.info-section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
  border-left: 3px solid #fa8c16;
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #262626;
}

.title-icon {
  color: #fa8c16;
  font-size: 18px;
}

.info-descriptions,
.system-descriptions {
  border-radius: 4px;
  overflow: hidden;
}

.info-descriptions :deep(.ant-descriptions-item-label),
.system-descriptions :deep(.ant-descriptions-item-label) {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
  width: 140px;
}

.system-info-section {
  margin-top: 16px;
}

.system-descriptions :deep(.ant-descriptions-item-label) {
  background-color: #ffffff;
  color: #8c8c8c;
}

.hierarchy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 0;
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

.location-hierarchy {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 16px;
  max-height: 480px;
  overflow-y: auto;
}

/* HierarchyNode styles moved to HierarchyNode.vue */
</style>
