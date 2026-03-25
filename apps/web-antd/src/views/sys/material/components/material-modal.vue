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
      <FormItem label="物料编码" name="materialCode">
        <Input
          v-model:value="formData.materialCode"
          placeholder="请输入物料编码"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem label="物料名称" name="materialName">
        <Input
          v-model:value="formData.materialName"
          placeholder="请输入物料名称"
          :maxlength="100"
        />
      </FormItem>
      <FormItem label="规格">
        <Input
          v-model:value="formData.specification"
          placeholder="请输入规格"
          :maxlength="100"
        />
      </FormItem>
      <FormItem label="单位">
        <Input
          v-model:value="formData.unit"
          placeholder="请输入单位"
          :maxlength="20"
        />
      </FormItem>
      <FormItem label="分类">
        <Input
          v-model:value="formData.category"
          placeholder="请输入物料分类"
          :maxlength="50"
        />
      </FormItem>
      <FormItem label="是否启用" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
        />
      </FormItem>
      <FormItem label="备注">
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
  isEdit.value ? '编辑物料' : '新增物料'
);

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

const formRules = {
  materialCode: [
    { required: true, message: '请输入物料编码', trigger: 'blur' },
    { max: 50, message: '物料编码最大50字符', trigger: 'blur' },
  ],
  materialName: [
    { required: true, message: '请输入物料名称', trigger: 'blur' },
    { max: 100, message: '物料名称最大100字符', trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: '请选择是否启用', trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getMaterialDetail(id);
    Object.assign(formData, res.data || res);
  } catch {
    message.error('加载详情失败');
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
      await updateMaterial(formData);
      message.success('更新成功');
    } else {
      await createMaterial(formData);
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
  formData.materialCode = '';
  formData.materialName = '';
  formData.specification = '';
  formData.unit = '';
  formData.category = '';
  formData.isEnabled = 1;
  formData.remark = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
