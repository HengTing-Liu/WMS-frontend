<template>
  <Modal
    v-bind="$attrs"
    :title="modalTitle"
    :width="700"
    :confirmLoading="confirmLoading"
    :open="isModalOpen"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <template v-if="isReady">
      <!-- 原仓库信息 -->
      <div class="mb-4">
        <span class="label">原仓库：</span>
        <span class="value">
          {{ initData.originalWarehouseName }} - {{ initData.originalTemperatureZone }}区
          （{{ initData.originalWarehouseCode }}）
        </span>
      </div>

      <!-- 存储容器列表 -->
      <div class="mb-4">
        <div class="section-title">存储容器列表：</div>
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
            <template v-if="column.key === 'currentWarehouse'">
              <span>
                {{ record.warehouseName || '-' }}
                {{ record.temperatureZone ? `(${record.temperatureZone}区)` : '' }}
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
import { message, Table, Checkbox, Select, Spin, Modal } from 'ant-design-vue';

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
  containers: [],
  availableWarehouses: [],
});
const targetWarehouseCode = ref<string | undefined>();
const selectedContainerIds = ref<number[]>([]);

// 计算属性
const modalTitle = computed(() => '分配仓库');

const containerColumns = [
  { title: '选择', key: 'selected', width: 60 },
  { title: '容器名称', dataIndex: 'containerName', key: 'containerName', width: 120 },
  { title: '容器编号', dataIndex: 'containerNo', key: 'containerNo', width: 100 },
  { title: '当前仓库', key: 'currentWarehouse', width: 200 },
];

const warehouseOptions = computed(() => {
  return initData.value.availableWarehouses.map((w) => ({
    label: w.displayName,
    value: w.warehouseCode,
  }));
});

const availableWarehouses = computed(() => initData.value.availableWarehouses || []);

// 加载初始化数据
const loadInitData = async () => {
  if (!props.locationId) {
    message.error('参数错误');
    return;
  }

  isReady.value = false;
  try {
    const res = await initAssignWarehouse(props.locationId, props.selectedContainerIds);
    if (res.code === 200) {
      initData.value = res.data;
      // 初始化已选中的容器ID
      selectedContainerIds.value = (res.data.containers || [])
        .filter((c) => c.selected)
        .map((c) => c.containerId);
      // 默认选中第一个仓库
      if (res.data.availableWarehouses && res.data.availableWarehouses.length > 0) {
        targetWarehouseCode.value = res.data.availableWarehouses[0].warehouseCode;
      }
    } else {
      message.error(res.msg || '加载数据失败');
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
    const res = await assignWarehouse({
      locationId: props.locationId,
      containerIds: selectedContainerIds.value,
      targetWarehouseCode: targetWarehouseCode.value,
    });

    if (res.code === 200) {
      message.success(res.msg || '分配成功');
      emit('success');
      isModalOpen.value = false;
    } else {
      message.error(res.msg || '分配失败');
    }
  } catch (error: any) {
    console.error('分配仓库失败:', error);
    message.error(error?.response?.data?.msg || error?.message || '分配失败');
  } finally {
    confirmLoading.value = false;
  }
};

// 监听 locationId 变化，重新加载数据
watch(
  () => props.locationId,
  () => {
    if (props.locationId) {
      loadInitData();
    }
  },
  { immediate: true },
);
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
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
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
