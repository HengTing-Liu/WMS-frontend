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
      <FormItem :label="$t('page.warehouse.warehouseCode')" name="warehouseCode">
        <Input
          v-model:value="formData.warehouseCode"
          :placeholder="$t('page.common.inputPlaceholder')"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.warehouseName')" name="warehouseName">
        <Input
          v-model:value="formData.warehouseName"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.temperatureZone')">
        <Input
          v-model:value="formData.temperatureZone"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.qualityZone')">
        <Input
          v-model:value="formData.qualityZone"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.employeeCode')">
        <Input
          v-model:value="formData.employeeCode"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.employeeName')">
        <Input
          v-model:value="formData.employeeName"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.deptCode')">
        <Input
          v-model:value="formData.deptCode"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.deptNameFullPath')">
        <Input
          v-model:value="formData.deptNameFullPath"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.company')">
        <Input
          v-model:value="formData.company"
          :placeholder="$t('page.common.inputPlaceholder')"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.isEnabled')" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
        />
      </FormItem>
      <FormItem :label="$t('page.warehouse.remark')">
        <Textarea
          v-model:value="formData.remark"
          :placeholder="$t('page.common.inputPlaceholder')"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { $t } from '@vben/locales';
import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  createWarehouse,
  updateWarehouse,
  getWarehouseDetail,
  type WarehouseResult,
} from '#/api/sys/warehouse';

const props = defineProps<{
  warehouseId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.warehouseId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.warehouse.editTitle') : $t('page.warehouse.addTitle')
);

const formData = reactive<Record<string, any>>({
  id: undefined,
  warehouseCode: '',
  warehouseName: '',
  temperatureZone: '',
  qualityZone: '',
  employeeCode: '',
  employeeName: '',
  deptCode: '',
  deptNameFullPath: '',
  company: '',
  isEnabled: 1,
  remark: '',
});

const formRules = {
  warehouseCode: [
    { required: true, message: () => $t('page.warehouse.codeRequired'), trigger: 'blur' },
    { max: 50, message: () => $t('page.warehouse.codeMaxLength'), trigger: 'blur' },
  ],
  warehouseName: [
    { required: true, message: () => $t('page.warehouse.nameRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.warehouse.nameMaxLength'), trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: () => $t('page.warehouse.statusRequired'), trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getWarehouseDetail(id);
    Object.assign(formData, res.data || res);
  } catch {
    message.error($t('page.warehouse.loadDetailFailed'));
  }
};

// 打开弹窗时加载数据
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
  if (id) {
    await loadDetail(id);
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateWarehouse(formData);
      message.success($t('page.common.updateSuccess'));
    } else {
      await createWarehouse(formData);
      message.success($t('page.common.createSuccess'));
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
  formData.warehouseCode = '';
  formData.warehouseName = '';
  formData.temperatureZone = '';
  formData.qualityZone = '';
  formData.employeeCode = '';
  formData.employeeName = '';
  formData.deptCode = '';
  formData.deptNameFullPath = '';
  formData.company = '';
  formData.isEnabled = 1;
  formData.remark = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
