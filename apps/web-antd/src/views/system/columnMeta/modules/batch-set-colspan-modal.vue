<template>
  <Modal
    v-model:open="visible"
    title="批量设置栅格列宽"
    :confirm-loading="loading"
    width="420px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 14 }"
    >
      <FormItem
        label="栅格列宽"
        name="colSpan"
        :rules="[{ required: true, message: '请选择列宽', trigger: 'change' }]"
      >
        <Select v-model:value="formData.colSpan" placeholder="请选择">
          <SelectOption :value="24">24（占满一行）</SelectOption>
          <SelectOption :value="18">18</SelectOption>
          <SelectOption :value="16">16</SelectOption>
          <SelectOption :value="12">12（一行两个）</SelectOption>
          <SelectOption :value="8">8（一行三个）</SelectOption>
          <SelectOption :value="6">6（一行四个）</SelectOption>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  Form,
  FormItem,
  Modal,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import { batchUpdateColSpan } from '#/api/system/columnMeta';

const props = defineProps<{
  selectedIds: number[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });
const loading = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive<{ colSpan: number | undefined }>({ colSpan: undefined });

watch(
  () => visible.value,
  (open) => {
    if (open) {
      formData.colSpan = undefined;
      formRef.value?.clearValidate();
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  await formRef.value?.validate();
  if (props.selectedIds.length === 0) {
    message.warning('没有选中的字段');
    visible.value = false;
    return;
  }
  if (formData.colSpan == null) {
    message.warning('请选择栅格列宽');
    return;
  }
  loading.value = true;
  try {
    await batchUpdateColSpan(props.selectedIds, formData.colSpan);
    message.success('批量设置列宽成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '批量设置列宽失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}
</script>
