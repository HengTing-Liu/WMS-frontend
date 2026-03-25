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
      <FormItem :label="$t('page.supplier.supplierCode')" name="supplierCode">
        <Input
          v-model:value="formData.supplierCode"
          :placeholder="$t('page.common.inputPlaceholder')"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.supplierName')" name="supplierName">
        <Input
          v-model:value="formData.supplierName"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.contactPerson')">
        <Input
          v-model:value="formData.contactPerson"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.contactPhone')">
        <Input
          v-model:value="formData.contactPhone"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="20"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.email')">
        <Input
          v-model:value="formData.email"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.address')">
        <Input
          v-model:value="formData.address"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="200"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.isEnabled')" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
        />
      </FormItem>
      <FormItem :label="$t('page.supplier.remark')">
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
  createSupplier,
  updateSupplier,
  getSupplierDetail,
  type SupplierResult,
} from '#/api/sys/supplier';

const props = defineProps<{
  supplierId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.supplierId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.supplier.editTitle') : $t('page.supplier.addTitle')
);

const formData = reactive<Record<string, any>>({
  id: undefined,
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
  address: '',
  isEnabled: 1,
  remark: '',
});

const formRules = {
  supplierCode: [
    { required: true, message: () => $t('page.supplier.codeRequired'), trigger: 'blur' },
    { max: 50, message: () => $t('page.supplier.codeMaxLength'), trigger: 'blur' },
  ],
  supplierName: [
    { required: true, message: () => $t('page.supplier.nameRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.supplier.nameMaxLength'), trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: () => $t('page.supplier.statusRequired'), trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getSupplierDetail(id);
    Object.assign(formData, res.data || res);
  } catch {
    message.error($t('page.supplier.loadDetailFailed'));
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
      await updateSupplier(formData);
      message.success($t('page.common.updateSuccess'));
    } else {
      await createSupplier(formData);
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
  formData.supplierCode = '';
  formData.supplierName = '';
  formData.contactPerson = '';
  formData.contactPhone = '';
  formData.email = '';
  formData.address = '';
  formData.isEnabled = 1;
  formData.remark = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
