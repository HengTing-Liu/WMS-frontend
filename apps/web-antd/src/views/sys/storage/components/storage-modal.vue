<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="700px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="localeFormRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem :label="$t('page.wms.storage.storageCode')" name="storageCode">
        <Input
          v-model:value="formData.storageCode"
          :placeholder="$t('page.wms.storage.storageCodePlaceholder')"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.wms.storage.storageName')" name="storageName">
        <Input
          v-model:value="formData.storageName"
          :placeholder="$t('page.wms.storage.storageNamePlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.wms.storage.warehouseId')" name="warehouseId">
        <Select
          v-model:value="formData.warehouseId"
          :placeholder="$t('page.wms.storage.warehouseIdPlaceholder')"
          :options="warehouseOptions"
          @change="handleWarehouseChange"
        />
      </FormItem>
      <FormItem :label="$t('page.wms.storage.locationId')" name="locationId">
        <Select
          v-model:value="formData.locationId"
          :placeholder="$t('page.wms.storage.locationIdPlaceholder')"
          :options="filteredLocationOptions"
          :disabled="!formData.warehouseId"
        />
      </FormItem>
      <FormItem :label="$t('page.wms.storage.storageType')" name="storageType">
        <Select
          v-model:value="formData.storageType"
          :placeholder="$t('page.wms.storage.storageTypePlaceholder')"
          :options="storageTypeOptions"
        />
      </FormItem>
      <FormItem :label="$t('page.wms.storage.capacity')" name="capacity">
        <InputNumber
          v-model:value="formData.capacity"
          :placeholder="$t('page.wms.storage.capacityPlaceholder')"
          :min="0"
          :max="999999"
          style="width: 100%"
        />
      </FormItem>
      <FormItem :label="$t('page.common.status')" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
          :checked-children="$t('page.common.enabled')"
          :un-checked-children="$t('page.common.disabled')"
        />
      </FormItem>
      <FormItem :label="$t('page.common.remark')">
        <Textarea
          v-model:value="formData.remark"
          :placeholder="$t('page.common.remarkPlaceholder')"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import { $t } from '@vben/locales';

import {
  createStorage,
  getStorageDetail,
  listLocationSimple,
  updateStorage,
  type StorageResult,
} from '#/api/sys/storage';

const props = defineProps<{
  storageId?: number;
  warehouseOptions?: Array<{ label: string; value: number }>;
  locationOptions?: Array<{ label: string; value: number }>;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.storageId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.wms.storage.editTitle') : $t('page.wms.storage.addTitle')
);

const storageTypeOptions = [
  { label: $t('page.wms.storage.storageType.PLANE'), value: 'PLANE' },
  { label: $t('page.wms.storage.storageType.STEREO'), value: 'STEREO' },
  { label: $t('page.wms.storage.storageType.RACK'), value: 'RACK' },
];

// i18n-aware form rules
const localeFormRules = computed(() => ({
  storageCode: [
    { required: true, message: $t('page.wms.storage.storageCodeRequired'), trigger: 'blur' },
    { max: 50, message: $t('page.wms.storage.storageCodeMaxLength'), trigger: 'blur' },
  ],
  storageName: [
    { required: true, message: $t('page.wms.storage.storageNameRequired'), trigger: 'blur' },
    { max: 100, message: $t('page.wms.storage.storageNameMaxLength'), trigger: 'blur' },
  ],
  warehouseId: [
    { required: true, message: $t('page.wms.storage.warehouseIdRequired'), trigger: 'change' },
  ],
  storageType: [
    { required: true, message: $t('page.wms.storage.storageTypeRequired'), trigger: 'change' },
  ],
}));

const formData = reactive<Record<string, any>>({
  id: undefined,
  storageCode: '',
  storageName: '',
  warehouseId: undefined,
  locationId: undefined,
  storageType: undefined,
  capacity: undefined,
  isEnabled: 1,
  remark: '',
});

// Filtered location options based on selected warehouse
const filteredLocationOptions = computed(() => {
  if (!formData.warehouseId) return [];
  if (props.locationOptions) {
    return props.locationOptions.filter((opt) => {
      return true;
    });
  }
  return [];
});

function handleWarehouseChange() {
  formData.locationId = undefined;
}

// 加载详情
async function loadDetail(id: number) {
  try {
    const res = await getStorageDetail(id);
    Object.assign(formData, res);
  } catch {
    message.error($t('page.wms.storage.loadDetailFailed'));
  }
}

// 打开弹窗时加载数据
async function open(id?: number) {
  visible.value = true;
  resetForm();
  if (id) {
    await loadDetail(id);
  }
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateStorage(formData);
      message.success($t('page.message.updateSuccess'));
    } else {
      await createStorage(formData);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error) {
    // 表单验证失败或请求失败
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

// 重置表单
const resetForm = () => {
  formData.id = undefined;
  formData.storageCode = '';
  formData.storageName = '';
  formData.warehouseId = undefined;
  formData.locationId = undefined;
  formData.storageType = undefined;
  formData.capacity = undefined;
  formData.isEnabled = 1;
  formData.remark = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
