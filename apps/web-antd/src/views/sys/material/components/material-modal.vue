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
      <FormItem :label="$t('page.material.materialCode')" name="materialCode">
        <Input
          v-model:value="formData.materialCode"
          :placeholder="$t('page.material.materialCodePlaceholder')"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.material.materialName')" name="materialName">
        <Input
          v-model:value="formData.materialName"
          :placeholder="$t('page.material.materialNamePlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.material.specification')">
        <Input
          v-model:value="formData.specification"
          :placeholder="$t('page.material.specificationPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.material.unit')">
        <Input
          v-model:value="formData.unit"
          :placeholder="$t('page.material.unitPlaceholder')"
          :maxlength="20"
        />
      </FormItem>
      <FormItem :label="$t('page.material.category')">
        <Input
          v-model:value="formData.category"
          :placeholder="$t('page.material.categoryPlaceholder')"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.material.isEnabled')" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
          :checked-children="$t('page.common.enabled')"
          :un-checked-children="$t('page.common.disabled')"
        />
      </FormItem>
      <FormItem :label="$t('page.material.remark')">
        <Textarea
          v-model:value="formData.remark"
          :placeholder="$t('page.material.remarkPlaceholder')"
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
  Modal,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import { $t } from '@vben/locales';
import type { Rule } from 'ant-design-vue/es/form';

import {
  createMaterial,
  updateMaterial,
  getMaterialDetail,
  type MaterialResult,
} from '#/api/sys/material';

const props = defineProps<{
  materialId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.materialId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.material.editTitle') : $t('page.material.addTitle')
);

// i18n-aware form rules
const localeFormRules = computed(() => ({
  materialCode: [
    { required: true, message: $t('page.material.codeRequired'), trigger: 'blur' },
    { max: 50, message: $t('page.material.codeMaxLength'), trigger: 'blur' },
  ],
  materialName: [
    { required: true, message: $t('page.material.nameRequired'), trigger: 'blur' },
    { max: 100, message: $t('page.material.nameMaxLength'), trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: $t('page.material.statusRequired'), trigger: 'change' },
  ],
}));

const formData = reactive<Record<string, any>>({
  id: undefined,
  materialCode: '',
  materialName: '',
  specification: '',
  unit: '',
  category: '',
  isEnabled: 1,
  remark: '',
});

// Load detail
const loadDetail = async (id: number) => {
  try {
    const res = await getMaterialDetail(id);
    Object.assign(formData, res.data || res);
  } catch {
    message.error($t('page.material.loadDetailFailed'));
  }
};

// Load data when opening modal
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
  if (id) {
    await loadDetail(id);
  }
};

// Submit
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateMaterial(formData);
      message.success($t('page.message.updateSuccess'));
    } else {
      await createMaterial(formData);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error) {
    // Form validation failed or request error
  } finally {
    loading.value = false;
  }
};

// Cancel
const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

// Reset form
const resetForm = () => {
  formData.id = undefined;
  formData.materialCode = '';
  formData.materialName = '';
  formData.specification = '';
  formData.unit = '';
  formData.category = '';
  formData.isEnabled = 1;
  formData.remark = '';
  formRef.value?.resetFields();
};

// Expose methods
defineExpose({
  open,
});
</script>
