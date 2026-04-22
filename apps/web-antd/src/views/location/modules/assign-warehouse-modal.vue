<template>
  <Modal
    v-bind="$attrs"
    :title="modalTitle"
    :width="900"
    :confirmLoading="confirmLoading"
    :open="isModalOpen"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <template v-if="isReady">
      <!-- 原仓库信息 -->
      <div class="info-section" v-if="initData.originalWarehouseCode">
        <div class="section-title">
          <IconifyIcon icon="material-symbols:warehouse" class="title-icon" />
          <span>原仓库信息</span>
        </div>
        <Descriptions :column="3" bordered size="small" class="info-descriptions">
          <DescriptionsItem label="仓库编码">{{ initData.originalWarehouseCode || '-' }}</DescriptionsItem>
          <DescriptionsItem label="仓库名称">{{ initData.originalWarehouseName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="仓库类型">{{ getWarehouseTypeText(initData.originalWarehouseType) }}</DescriptionsItem>
          <DescriptionsItem label="ERP公司名称">{{ initData.originalErpCompanyName || '-' }}</DescriptionsItem>
          <DescriptionsItem label="所在地">{{ initData.originalWarehouseLocation || '-' }}</DescriptionsItem>
          <DescriptionsItem label="温度分区">{{ initData.originalTemperatureZone || '-' }}</DescriptionsItem>
          <DescriptionsItem label="质量分区">{{ initData.originalQualityZone || '-' }}</DescriptionsItem>
          <DescriptionsItem label="存储物料">{{ initData.originalStoredMaterial || '-' }}</DescriptionsItem>
          <DescriptionsItem label="责任部门">{{ initData.originalDeptNameFullPath || '-' }}</DescriptionsItem>
        </Descriptions>
      </div>

      <!-- 存储分区/容器列表 -->
      <div class="mb-4">
        <div class="section-title">
          <span>存储分区/容器列表：</span>
          <Checkbox
            v-model:checked="allContainersSelected"
            :indeterminate="isIndeterminate"
            class="ml-2"
          >
            {{ allContainersSelected ? '取消全选' : '全选' }}
          </Checkbox>
        </div>
        <Table
          :columns="containerColumns"
          :data-source="initData.containers"
          :pagination="false"
          :scroll="{ y: 200 }"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'selected'">
              <Checkbox
                :checked="record.selected"
                @change="(e) => handleContainerSelect(record, e.target.checked)"
              />
            </template>
            <template v-if="column.key === 'locationGrade'">
              <Tag :color="getLocationGradeColor(record.locationGrade)">
                {{ getLocationGradeText(record.locationGrade) }}
              </Tag>
            </template>
            <template v-if="column.key === 'currentWarehouse'">
              <span class="warehouse-info">
                {{ record.erpCompanyName || '' }}
                {{ getWarehouseTypeText(record.warehouseType) || '' }}
                {{ record.warehouseLocation ? `- ${record.warehouseLocation}` : '' }}
                {{ record.warehouseName || '' }}
                {{ record.temperatureZone || '' }}
                {{ record.qualityZone || '' }}
                {{ record.warehouseCode ? `(${record.warehouseCode})` : '' }}
              </span>
            </template>
          </template>
        </Table>
      </div>

      <!-- 目标仓库选择 -->
      <div class="mb-4">
        <div class="section-title">可选仓库（温区一致的隔离仓/留样仓）：</div>
        <Select
          v-model:value="targetWarehouseCode"
          :options="warehouseOptions"
          placeholder="请选择目标仓库"
          style="width: 100%"
          :disabled="availableWarehouses.length === 0"
        />
        <div v-if="availableWarehouses.length === 0" class="text-muted mt-1">
          暂无可分配的仓库
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex justify-center items-center" style="height: 200px">
        <Spin />
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message, Table, Checkbox, Select, Spin, Modal, Descriptions, DescriptionsItem, Tag } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import {
  initAssignWarehouse,
  assignWarehouse,
  type AssignWarehouseInitResponse,
} from '#/api/wms/location';

defineOptions({
  name: 'AssignWarehouseModal',
});

const props = defineProps<{
  locationId?: number;
  selectedContainerIds?: number[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// Modal 相关
const isModalOpen = ref(false);

function handleCancel() {
  isModalOpen.value = false;
}

// 暴露 open 方法
defineExpose({
  open: () => {
    resetState();
    if (props.locationId) {
      loadInitData();
    }
    isModalOpen.value = true;
  },
});

// 重置状态
const resetState = () => {
  isReady.value = false;
  initData.value = {
    originalWarehouseCode: '',
    originalWarehouseName: '',
    originalTemperatureZone: '',
    originalWarehouseType: '',
    originalErpCompanyName: '',
    originalWarehouseLocation: '',
    originalQualityZone: '',
    originalEmployeeName: '',
    originalStoredMaterial: '',
    originalDeptNameFullPath: '',
    containers: [],
    availableWarehouses: [],
  };
  targetWarehouseCode.value = undefined;
  selectedContainerIds.value = [];
};

// 状态
const isReady = ref(false);
const confirmLoading = ref(false);
const initData = ref<AssignWarehouseInitResponse>({
  originalWarehouseCode: '',
  originalWarehouseName: '',
  originalTemperatureZone: '',
  originalWarehouseType: '',
  originalErpCompanyName: '',
  originalWarehouseLocation: '',
  originalQualityZone: '',
  originalEmployeeName: '',
  originalStoredMaterial: '',
  originalDeptNameFullPath: '',
  containers: [],
  availableWarehouses: [],
});
const targetWarehouseCode = ref<string | undefined>();
const selectedContainerIds = ref<number[]>([]);

// 计算属性
const modalTitle = computed(() => '分配仓库');

const containerColumns = [
  { title: '选择', key: 'selected', width: 80 },
  { title: '库位等级', key: 'locationGrade', width: 100 },
  { title: '全路径名称', dataIndex: 'locationFullpathName', key: 'locationFullpathName', width: 250 },
  { title: '当前仓库', key: 'currentWarehouse', width: 400 },
];

const warehouseOptions = computed(() => {
  return initData.value.availableWarehouses.map((w) => ({
    label: w.displayName,
    value: w.warehouseCode,
  }));
});

const availableWarehouses = computed(() => initData.value.availableWarehouses || []);

// 全选/取消全选
const allContainersSelected = computed({
  get: () => {
    const containers = initData.value.containers || [];
    return containers.length > 0 && containers.every((c: any) => c.selected);
  },
  set: (val: boolean) => {
    (initData.value.containers || []).forEach((c: any) => {
      c.selected = val;
    });
    selectedContainerIds.value = val
      ? (initData.value.containers || []).map((c: any) => c.containerId)
      : [];
  },
});

const isIndeterminate = computed(() => {
  const containers = initData.value.containers || [];
  const selectedCount = containers.filter((c: any) => c.selected).length;
  return selectedCount > 0 && selectedCount < containers.length;
});

// 库位等级文本映射
function getLocationGradeText(grade?: string): string {
  const textMap: Record<string, string> = {
    StorageSection: '存储分区',
    TypeSection: '存储分区',
    '存储分区': '存储分区',
    Container: '存储容器',
    '存储容器': '存储容器',
  };
  return grade ? (textMap[grade] || grade) : '-';
}

// 库位等级颜色映射
function getLocationGradeColor(grade?: string): string {
  const colorMap: Record<string, string> = {
    StorageSection: 'blue',
    TypeSection: 'blue',
    '存储分区': 'blue',
    Container: 'green',
    '存储容器': 'green',
  };
  return grade ? (colorMap[grade] || 'default') : 'default';
}

// 仓库类型文本映射
function getWarehouseTypeText(type?: string): string {
  const textMap: Record<string, string> = {
    QUARANTINE: '隔离仓',
    SAMPLE: '留样仓',
    STORAGE: '存储仓',
    PICK: '拣货仓',
    COLLECT: '集货仓',
    RETURN: '退货仓',
  };
  return type ? (textMap[type] || type) : '-';
}

// 加载初始化数据
const loadInitData = async () => {
  if (!props.locationId) {
    message.error('参数错误');
    return;
  }

  isReady.value = false;
  try {
    // requestClient 配置了 responseReturn: 'data'，直接返回 data 部分
    const data = await initAssignWarehouse(props.locationId, props.selectedContainerIds);
    initData.value = data;
    // 初始化已选中的容器ID
    selectedContainerIds.value = (data.containers || [])
      .filter((c: any) => c.selected)
      .map((c: any) => c.containerId);
    // 默认选中第一个仓库
    if (data.availableWarehouses && data.availableWarehouses.length > 0) {
      targetWarehouseCode.value = data.availableWarehouses[0].warehouseCode;
    }
  } catch (error) {
    console.error('加载分配仓库数据失败:', error);
    message.error('加载数据失败');
  } finally {
    isReady.value = true;
  }
};

// 处理容器选择
const handleContainerSelect = (record: any, checked: boolean) => {
  record.selected = checked;
  if (checked) {
    if (!selectedContainerIds.value.includes(record.containerId)) {
      selectedContainerIds.value.push(record.containerId);
    }
  } else {
    selectedContainerIds.value = selectedContainerIds.value.filter(
      (id) => id !== record.containerId,
    );
  }
};

// 提交
const handleSubmit = async () => {
  if (selectedContainerIds.value.length === 0) {
    message.warning('请选择要分配的存储容器');
    return;
  }
  if (!targetWarehouseCode.value) {
    message.warning('请选择目标仓库');
    return;
  }

  confirmLoading.value = true;

  try {
    await assignWarehouse({
      locationId: props.locationId,
      containerIds: selectedContainerIds.value,
      targetWarehouseCode: targetWarehouseCode.value,
    });

    message.success('分配成功');
    emit('success');
    isModalOpen.value = false;
  } catch (error: any) {
    console.error('分配仓库失败:', error);
    message.error(error?.response?.data?.msg || error?.message || '分配失败');
  } finally {
    confirmLoading.value = false;
  }
};


</script>

<style scoped>
.label {
  font-weight: 500;
  color: #333;
}

.value {
  color: #666;
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

.info-section {
  margin-bottom: 16px;
}

.info-descriptions {
  border-radius: 4px;
  overflow: hidden;
}

.info-descriptions :deep(.ant-descriptions-item-label) {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
  width: 140px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-1 {
  margin-top: 4px;
}

.text-muted {
  color: #999;
  font-size: 12px;
}
</style>
