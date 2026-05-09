<template>
  <div class="property-panel">
    <!-- 空状态 -->
    <div v-if="!container" class="empty-state">
      <Empty :description="$t('page.location.selectContainer')" image="simple" />
    </div>

    <!-- 表单内容 -->
    <div v-else class="panel-content">
      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <!-- 基本信息 -->
        <Card size="small" :title="$t('page.location.basicInfo')" class="section-card">
          <FormItem :label="$t('page.location.containerName')" name="name">
            <Input v-model:value="formData.name" :placeholder="$t('page.location.containerName')" />
          </FormItem>

          <FormItem :label="$t('page.location.containerCode')" name="code">
            <Input v-model:value="formData.code" :placeholder="$t('page.location.containerCode')" />
          </FormItem>

          <FormItem :label="$t('page.location.containerType')" name="type">
            <Select v-model:value="formData.type" disabled
              :options="typeOptions"
            />
          </FormItem>

          <FormItem :label="$t('page.common.status')" name="status">
            <RadioGroup v-model:value="formData.status">
              <Radio value="enabled">{{ $t('page.common.enabled') }}</Radio>
              <Radio value="disabled">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Card>

        <!-- 容量设置 -->
        <Card v-if="showCapacity" size="small" :title="$t('page.location.capacitySettings')" class="section-card">
          <FormItem :label="$t('page.location.capacity')" name="capacity">
            <InputNumber
              v-model:value="formData.capacity"
              :min="0"
              style="width: 100%"
              :placeholder="$t('page.location.capacity')"
            />
          </FormItem>

          <FormItem :label="$t('page.location.usedCapacity')">
            <InputNumber
              v-model:value="formData.usedCapacity"
              :min="0"
              :max="formData.capacity"
              style="width: 100%"
              disabled
            />
          </FormItem>

          <FormItem :label="$t('page.location.occupancyRate')">
            <Progress
              :percent="occupancyRate"
              :status="occupancyStatus"
              :stroke-color="occupancyColor"
            />
          </FormItem>
        </Card>

        <!-- 尺寸设置 -->
        <Card v-if="showDimensions" size="small" :title="$t('page.location.dimensionSettings') + ' (cm)'" class="section-card">
          <FormItem :label="$t('page.location.length')" name="length">
            <InputNumber v-model:value="formData.length" :min="0" :precision="2" style="width: 100%" />
          </FormItem>

          <FormItem :label="$t('page.location.width')" name="width">
            <InputNumber v-model:value="formData.width" :min="0" :precision="2" style="width: 100%" />
          </FormItem>

          <FormItem :label="$t('page.location.height')" name="height">
            <InputNumber v-model:value="formData.height" :min="0" :precision="2" style="width: 100%" />
          </FormItem>
        </Card>

        <!-- 描述 -->
        <Card size="small" :title="$t('page.location.description')" class="section-card">
          <FormItem name="description">
            <Textarea
              v-model:value="formData.description"
              :rows="3"
              :placeholder="$t('page.location.description')"
            />
          </FormItem>
        </Card>

        <!-- 操作按钮 -->
        <div class="panel-footer">
          <Button block @click="handleReset">{{ $t('page.common.reset') }}</Button>
          <Button type="primary" block :loading="submitting" @click="handleSave">
            <IconifyIcon icon="material-symbols:save" />
            {{ $t('page.common.save') }}
          </Button>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Button,
  Card,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Textarea,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { LocationApi } from '#/api';

const props = defineProps<{
  container: LocationApi.Container | null;
}>();

const emit = defineEmits<{
  save: [data: Partial<LocationApi.Container>];
}>();

// 表单引用
const formRef = ref();
const submitting = ref(false);

// 表单数据
const formData = ref<Partial<LocationApi.Container>>({});

// 类型选项
const typeOptions = [
  { label: $t('page.location.type.warehouse'), value: 'warehouse' },
  { label: $t('page.location.type.area'), value: 'area' },
  { label: $t('page.location.type.shelf'), value: 'shelf' },
  { label: $t('page.location.type.slot'), value: 'slot' },
  { label: $t('page.location.type.box'), value: 'box' },
];

// 计算属性
const showCapacity = computed(() => {
  return ['area', 'shelf', 'slot', 'box'].includes(props.container?.type || '');
});

const showDimensions = computed(() => {
  return ['warehouse', 'area', 'shelf', 'slot'].includes(props.container?.type || '');
});

const occupancyRate = computed(() => {
  const capacity = formData.value.capacity || 0;
  const used = formData.value.usedCapacity || 0;
  if (capacity === 0) return 0;
  return Math.round((used / capacity) * 100);
});

const occupancyStatus = computed(() => {
  if (occupancyRate.value >= 90) return 'exception';
  if (occupancyRate.value >= 70) return 'normal';
  return 'success';
});

const occupancyColor = computed(() => {
  if (occupancyRate.value >= 90) return '#ff4d4f';
  if (occupancyRate.value >= 70) return '#faad14';
  return '#52c41a';
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: () => $t('page.location.nameRequired'), trigger: 'blur' }],
  code: [{ required: true, message: () => $t('page.location.codeRequired'), trigger: 'blur' }],
};

// 重置表单
const handleReset = () => {
  if (props.container) {
    formData.value = { ...props.container };
  }
};

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;
    emit('save', formData.value);
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

// 监听容器变化
watch(
  () => props.container,
  (newVal) => {
    if (newVal) {
      handleReset();
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="less">
.property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  padding-bottom: 80px;
}

.section-card {
  margin-bottom: 16px;

  :deep(.ant-card-head) {
    min-height: 40px;
    padding: 0 12px;

    .ant-card-head-title {
      font-size: 14px;
      font-weight: 500;
    }
  }

  :deep(.ant-card-body) {
    padding: 12px;
  }
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  position: sticky;
  bottom: 0;
  margin: 0 -16px -16px;
}
</style>
