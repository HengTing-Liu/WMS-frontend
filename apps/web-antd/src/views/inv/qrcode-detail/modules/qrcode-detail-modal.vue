<template>
  <Modal
    :title="isEdit ? $t('page.inv.qrcodeDetail.editTitle') : $t('page.inv.qrcodeDetail.addTitle')"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="500px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 二维码 -->
      <FormItem :label="$t('page.inv.qrcodeDetail.qrcode')" name="qrcode">
        <Input
          v-model:value="formData.qrcode"
          :placeholder="$t('page.inv.qrcodeDetail.qrcodePlaceholder')"
          :max-length="100"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Modal, Form, FormItem, Input, message } from 'ant-design-vue';
import { $t } from '@vben/locales';

import {
  addQrcodeDetail,
  updateQrcodeDetail,
  getQrcodeDetailById,
  type InvQrcodedetailApi,
} from '#/api/inv/qrcode-detail';

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const formData = reactive<Partial<InvQrcodedetailApi.QrcodeDetail>>({
  id: undefined,
  qrcode: '',
});

// 表单校验规则
const rules: any = computed(() => ({
  qrcode: [
    { required: true, message: $t('page.inv.qrcodeDetail.qrcodeRequired'), trigger: 'blur' },
    { min: 1, max: 100, message: $t('page.inv.qrcodeDetail.qrcodeLength'), trigger: 'blur' },
  ],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 打开弹窗
const open = async (row?: InvQrcodedetailApi.QrcodeDetail) => {
  visible.value = true;
  isEdit.value = !!row?.id;

  // 重置表单
  Object.assign(formData, {
    id: undefined,
    qrcode: '',
  });

  if (isEdit.value && row?.id) {
    try {
      loading.value = true;
      const res = await getQrcodeDetailById(row.id);
      if (res) {
        Object.assign(formData, {
          id: res.id,
          qrcode: res.qrcode || '',
        });
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const data = { ...formData };

    if (isEdit.value && data.id) {
      await updateQrcodeDetail(data);
      message.success($t('page.message.editSuccess'));
    } else {
      await addQrcodeDetail(data);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(isEdit.value ? $t('page.message.editFail') : $t('page.message.addFail'));
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  formRef.value?.resetFields();
};

defineExpose({ open });
</script>
