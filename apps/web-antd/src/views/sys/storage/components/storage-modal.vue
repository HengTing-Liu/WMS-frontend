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
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem :label="'货位编码'" name="storageCode">
        <Input
          v-model:value="formData.storageCode"
          placeholder="请输入货位编码"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="'货位名称'" name="storageName">
        <Input
          v-model:value="formData.storageName"
          placeholder="请输入货位名称"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="'所属仓库'" name="warehouseId">
        <Select
          v-model:value="formData.warehouseId"
          placeholder="请选择所属仓库"
          :options="warehouseOptions"
          @change="handleWarehouseChange"
        />
      </FormItem>
      <FormItem :label="'所属库区'" name="locationId">
        <Select
          v-model:value="formData.locationId"
          placeholder="请选择所属库区"
          :options="filteredLocationOptions"
          :disabled="!formData.warehouseId"
        />
      </FormItem>
      <FormItem :label="'货位类型'" name="storageType">
        <Select
          v-model:value="formData.storageType"
          placeholder="请选择货位类型"
          :options="storageTypeOptions"
        />
      </FormItem>
      <FormItem :label="'容量'" name="capacity">
        <InputNumber
          v-model:value="formData.capacity"
          placeholder="请输入容量"
          :min="0"
          :max="999999"
          style="width: 100%"
        />
      </FormItem>
      <FormItem :label="'状态'" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
          checked-children="启用"
          un-checked-children="停用"
        />
      </FormItem>
      <FormItem :label="'备注'">
        <Textarea
          v-model:value="formData.remark"
          placeholder="请输入备注"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
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
  isEdit.value ? '编辑货位' : '新建货位'
);

const storageTypeOptions = [
  { label: '平面', value: 'PLANE' },
  { label: '立体', value: 'STEREO' },
  { label: '货架', value: 'RACK' },
];

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
  // Location options are already filtered by warehouseId in parent, but we can also filter here
  if (props.locationOptions) {
    return props.locationOptions.filter((opt) => {
      // This is a simplification - in real scenario we'd need warehouseId on each location
      return true;
    });
  }
  return [];
});

const formRules = {
  storageCode: [
    { required: true, message: '请输入货位编码', trigger: 'blur' },
    { max: 50, message: '货位编码最多50个字符', trigger: 'blur' },
  ],
  storageName: [
    { required: true, message: '请输入货位名称', trigger: 'blur' },
    { max: 100, message: '货位名称最多100个字符', trigger: 'blur' },
  ],
  warehouseId: [
    { required: true, message: '请选择所属仓库', trigger: 'change' },
  ],
  storageType: [
    { required: true, message: '请选择货位类型', trigger: 'change' },
  ],
};

// Watch warehouse change to reset location
function handleWarehouseChange() {
  formData.locationId = undefined;
}

// 加载详情
async function loadDetail(id: number) {
  try {
    const res = await getStorageDetail(id);
    Object.assign(formData, res);
  } catch {
    message.error('加载货位详情失败');
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
      message.success('更新成功');
    } else {
      await createStorage(formData);
      message.success('创建成功');
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
