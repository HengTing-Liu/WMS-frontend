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
      <FormItem label="用户名" name="username">
        <Input v-model:value="formData.username" :disabled="isEdit" />
      </FormItem>
      <FormItem v-if="!isEdit" label="密码" name="password">
        <InputPassword v-model:value="formData.password" />
      </FormItem>
      <FormItem label="姓名" name="realName">
        <Input v-model:value="formData.realName" />
      </FormItem>
      <FormItem label="手机号" name="phone">
        <Input v-model:value="formData.phone" />
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
import { Modal, Form, FormItem, Input, InputPassword, RadioGroup, Radio } from 'ant-design-vue';
import { $t } from '@vben/locales';

interface Props {
  userId?: number;
}

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const isEdit = computed(() => !!props.userId);

const formData = ref({
  username: '',
  password: '',
  realName: '',
  phone: '',
  status: 1,
});

const emit = defineEmits<{ (e: 'success'): void }>();

const open = (row?: any) => {
  visible.value = true;
  formData.value = { username: '', password: '', realName: '', phone: '', status: 1 };
  if (row?.userId) {
    Object.assign(formData.value, row);
    formData.value.password = '';
  }
};

const handleSubmit = async () => {
  loading.value = true;
  // TODO: 调用 createUser / updateUser API
  setTimeout(() => {
    visible.value = false;
    emit('success');
    loading.value = false;
  }, 500);
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({ open });
</script>