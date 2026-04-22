<template>
  <Modal
    :open="visible"
    :title="dialogTitle"
    :confirm-loading="loading"
    width="700px"
    :ok-text="$t('page.common.confirm')"
    :cancel-text="$t('page.common.cancel')"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <Form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <Form.Item label="所属仓库">
        <Input :value="record?.warehouseCode || ''" disabled />
      </Form.Item>

      <Form.Item label="仓库档案信息">
        <Input :value="warehouseInfoText" disabled />
      </Form.Item>

      <Form.Item label="排序号">
        <Input :value="record?.locationSortNo || ''" disabled />
      </Form.Item>

      <Form.Item label="全路径名称">
        <Input :value="record?.locationFullpathName || ''" disabled />
      </Form.Item>

      <Form.Item label="库位等级">
        <Input :value="locationGradeLabel" disabled />
      </Form.Item>

      <Form.Item label="库位类型名称">
        <Input :value="record?.locationType || ''" disabled />
      </Form.Item>

      <Form.Item label="库位名称" name="locationName">
        <Input v-model:value="formState.locationName" placeholder="请输入库位名称" />
      </Form.Item>

      <Form.Item label="规格">
        <Input
          v-model:value="formState.specification"
          :disabled="!canEditSpecification"
          :placeholder="canEditSpecification ? '如：4x4, 8x12' : '已绑定物料，仅可查看'"
        />
        <div v-if="isBound" class="form-tip warning">
          该库位已绑定物料，仅可修改名称
        </div>
      </Form.Item>

      <Form.Item label="存储模式">
        <Select
          v-model:value="formState.storageMode"
          :disabled="!canEditStorageMode"
          :options="storageModeOptions"
          placeholder="请选择存储模式"
        />
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea v-model:value="formState.remarks" :rows="3" placeholder="可选" />
      </Form.Item>
    </Form>

    <!-- 绑定物料信息提示 -->
    <div v-if="isBound" class="bound-warning">
      <IconifyIcon icon="material-symbols:warning" />
      <span>{{ boundWarningText }}</span>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Modal, Form, Input, Select, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { checkLocationBind, updateLocationById } from '#/api/sys/location';
import { listWarehouseSimpleForLocation } from '#/api/sys/warehouse';
import type { LocationBindStatus } from '#/api/sys/location';

const props = defineProps<{
  visible: boolean;
  record: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

const loading = ref(false);
const formRef = ref();
const bindStatus = ref<LocationBindStatus | null>(null);
const loadingBindStatus = ref(false);

// 表单状态
const formState = ref({
  locationName: '',
  storageMode: undefined as string | undefined,
  specification: '',
  remarks: '',
});

// 仓库选项
const warehouseOptions = ref<Array<{ label: string; value: string }>>([]);

// 仓库档案信息文本
const warehouseInfoText = computed(() => {
  if (!props.record) return '-';
  const parts: string[] = [];
  if (props.record.warehouseName) parts.push(props.record.warehouseName);
  if (props.record.temperatureZone) parts.push(props.record.temperatureZone + '区');
  if (props.record.warehouseLocation) parts.push(props.record.warehouseLocation);
  return parts.length > 0 ? parts.join(' ') : '-';
});

const storageModeOptions = [
  { label: '共享模式', value: 'Shared' },
  { label: '独占模式', value: 'Exclusive' },
];

// ========== 计算属性 ==========

// 库位等级
const locationGrade = computed(() => props.record?.locationGrade || '');

// 库位等级标签
const locationGradeLabel = computed(() => {
  const gradeMap: Record<string, string> = {
    StorageType: '存储类型',
    StorageSection: '存储分区',
    Container: '存储容器',
    ContainerPosition: '存储孔位',
  };
  return gradeMap[locationGrade.value] || locationGrade.value;
});

// 是否为存储容器
const isContainer = computed(() => locationGrade.value === 'Container');

// 是否为存储孔位
const isPosition = computed(() => locationGrade.value === 'ContainerPosition');

// 是否已绑定物料
const isBound = computed(() => bindStatus.value?.isBound === true);

// 根据库位等级和绑定状态判断字段可编辑性
const canEditStorageMode = computed(() => {
  // 存储孔位：不可修改
  if (isPosition.value) return false;
  // 已绑定：不可修改
  if (isBound.value) return false;
  // 仅存储容器可修改
  return isContainer.value;
});

const canEditSpecification = computed(() => {
  // 存储孔位：不可修改
  if (isPosition.value) return false;
  // 已绑定：不可修改
  if (isBound.value) return false;
  // 仅存储容器可修改
  return isContainer.value;
});

// 弹窗标题
const dialogTitle = computed(() => {
  if (isPosition.value) {
    return '查看库位详情';
  }
  return '编辑库位';
});

// 绑定物料警告文本
const boundWarningText = computed(() => {
  if (isPosition.value) {
    return '存储孔位由系统自动生成，不可手动编辑';
  }
  return '该库位已绑定物料，仅可修改名称';
});

// ========== 监听逻辑 ==========

watch(
  () => props.visible,
  async (val) => {
    if (val && props.record) {
      // 初始化表单数据
      formState.value = {
        locationName: props.record.locationName || '',
        storageMode: props.record.storageMode,
        specification: props.record.specification || '',
        remarks: props.record.remarks || '',
      };

      // 查询绑定状态
      await loadBindStatus();
    }
  }
);

watch(
  () => formState.value.storageMode,
  async (newMode, oldMode) => {
    if (!props.visible || !props.record) return;

    // 独占模式改为共享模式时，重置规格
    if (oldMode === 'Exclusive' && newMode === 'Shared') {
      formState.value.specification = '';
    }
  }
);

// ========== 方法 ==========

async function loadBindStatus() {
  if (!props.record?.id) return;

  loadingBindStatus.value = true;
  try {
    bindStatus.value = await checkLocationBind(props.record.id);
  } catch {
    bindStatus.value = { isBound: false };
  } finally {
    loadingBindStatus.value = false;
  }
}

async function loadWarehouseOptions() {
  try {
    const list = await listWarehouseSimpleForLocation();
    warehouseOptions.value = list.map((item: any) => ({
      label: item.label,
      value: item.value,
    }));
  } catch {
    warehouseOptions.value = [];
  }
}

function handleClose() {
  emit('update:visible', false);
}

async function handleSubmit() {
  // 存储孔位不允许编辑
  if (isPosition.value) {
    message.warning('存储孔位由系统自动生成，不可手动编辑');
    return;
  }

  // 名称必填
  if (!formState.value.locationName?.trim()) {
    message.warning('请输入库位名称');
    return;
  }

  loading.value = true;
  try {
    const data: Record<string, any> = {
      locationName: formState.value.locationName,
      remarks: formState.value.remarks,
    };

    // 仅允许修改的字段
    if (canEditStorageMode.value) {
      data.storageMode = formState.value.storageMode;
    }
    if (canEditSpecification.value) {
      data.specification = formState.value.specification;
    }

    await updateLocationById(props.record.id, data);
    message.success($t('page.message.updateSuccess'));
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error?.message || $t('page.message.saveFail'));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWarehouseOptions();
});
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-tip.warning {
  color: #ff4d4f;
}

.bound-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff2e8;
  border: 1px solid #ffbb96;
  border-radius: 4px;
  color: #d46b08;
  font-size: 13px;
  margin-top: 8px;
}
</style>
