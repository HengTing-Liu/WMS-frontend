<template>
  <Modal
    :title="isEdit ? $t('page.common.edit') : $t('page.common.add')"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="640px"
  >
    <Form ref="formRef" :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <FormItem label="客户名称" name="customerName">
        <Input v-model:value="formData.customerName" />
      </FormItem>
      <FormItem label="联系人" name="contact">
        <Input v-model:value="formData.contact" />
      </FormItem>
      <FormItem label="手机号" name="phone">
        <Input v-model:value="formData.phone" />
      </FormItem>
      <FormItem label="地址" name="address">
        <Textarea v-model:value="formData.address" :rows="2" />
      </FormItem>
      <FormItem label="状态" name="status">
        <RadioGroup v-model:value="formData.status">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </RadioGroup>
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Modal, Form, FormItem, Input, Textarea, RadioGroup, Radio, message } from 'ant-design-vue';
import { $t } from '@vben/locales';

interface Props {
  customerId?: number;
}

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const isEdit = computed(() => !!props.customerId);

const formData = ref({
  customerName: '',
  contact: '',
  phone: '',
  address: '',
  status: 1,
});

const emit = defineEmits<{ (e: 'success'): void }>();

const open = (row?: any) => {
  visible.value = true;
  formData.value = { customerName: '', contact: '', phone: '', address: '', status: 1 };
  if (row?.customerId) Object.assign(formData.value, row);
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    // TODO: 调用 createCustomer / updateCustomer API
    await new Promise((r) => setTimeout(r, 500));
    message.success(isEdit.value ? '编辑成功' : '新增成功');
    visible.value = false;
    emit('success');
  } catch {
    message.error('操作失败');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({ open });
</script>