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
      <FormItem label="表编码" name="tableCode">
        <Input
          v-model:value="formData.tableCode"
          placeholder="请输入表编码"
          :disabled="isEdit"
          :maxlength="100"
        />
      </FormItem>
      <FormItem label="表名称" name="tableName">
        <Input v-model:value="formData.tableName" placeholder="请输入表名称" :maxlength="100" />
      </FormItem>
      <FormItem label="所属模块" name="module">
        <Select v-model:value="formData.module" placeholder="请选择所属模块">
          <SelectOption value="base">base</SelectOption>
          <SelectOption value="wms">wms</SelectOption>
          <SelectOption value="sys">sys</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="实体类名">
        <Input v-model:value="formData.entityClass" placeholder="com.xxx.Entity" />
      </FormItem>
      <FormItem label="服务类名">
        <Input v-model:value="formData.serviceClass" placeholder="com.xxx.Service" />
      </FormItem>
      <FormItem label="权限标识">
        <Input v-model:value="formData.permissionCode" placeholder="system:meta:xxx" />
      </FormItem>
      <FormItem label="逻辑删除字段">
        <Input v-model:value="formData.isDeletedColumn" placeholder="is_deleted / del_flag" :maxlength="64" />
      </FormItem>
      <FormItem label="默认分页大小">
        <InputNumber v-model:value="formData.pageSize" :min="1" :max="500" style="width: 100%" />
      </FormItem>
      <FormItem label="是否树形">
        <RadioGroup v-model:value="formData.isTree">
          <Radio :value="1">是</Radio>
          <Radio :value="0">否</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem label="状态">
        <Switch v-model:checked="statusChecked" />
      </FormItem>
      <FormItem label="备注">
        <Textarea v-model:value="formData.remark" :rows="3" />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  SelectOption,
  Switch,
  Textarea,
  Radio,
  RadioGroup,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  addTableMeta,
  getTableMetaById,
  updateTableMeta,
  type TableMetaResult,
} from '#/api/system/tableMeta';

const props = defineProps<{
  mode: 'add' | 'edit';
  data?: TableMetaResult | null;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => props.mode === 'edit');

const modalTitle = computed(() => (isEdit.value ? '编辑表元数据' : '新增表元数据'));

const formData = reactive<Record<string, any>>({
  id: undefined,
  tableCode: '',
  tableName: '',
  module: '',
  entityClass: '',
  serviceClass: '',
  permissionCode: '',
  isDeletedColumn: '',
  pageSize: 20,
  isTree: 0,
  status: 1,
  remark: '',
});

const statusChecked = computed({
  get: () => Number(formData.status ?? 1) === 1,
  set: (val: boolean) => {
    formData.status = val ? 1 : 0;
  },
});

const formRules = {
  tableCode: [
    { required: true, message: '请输入表编码', trigger: 'blur' },
    { max: 100, message: '表编码最多100个字符', trigger: 'blur' },
  ],
  tableName: [
    { required: true, message: '请输入表名称', trigger: 'blur' },
    { max: 100, message: '表名称最多100个字符', trigger: 'blur' },
  ],
  module: [{ required: true, message: '请选择所属模块', trigger: 'change' }],
};

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: undefined,
    tableCode: '',
    tableName: '',
    module: '',
    entityClass: '',
    serviceClass: '',
    permissionCode: '',
    isDeletedColumn: '',
    pageSize: 20,
    isTree: 0,
    status: 1,
    remark: '',
  });
}

async function loadDetail(id: number) {
  try {
    loading.value = true;
    const detail = await getTableMetaById(id);
    Object.assign(formData, detail);
  } catch (error: any) {
    message.error(error?.message || '加载详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const payload = {
      ...formData,
      tableCode: formData.tableCode?.trim(),
      tableName: formData.tableName?.trim(),
      module: formData.module?.trim(),
      entityClass: formData.entityClass?.trim() || '',
      serviceClass: formData.serviceClass?.trim() || '',
      permissionCode: formData.permissionCode?.trim() || '',
      isDeletedColumn: formData.isDeletedColumn?.trim() || '',
      remark: formData.remark?.trim() || '',
    };

    if (isEdit.value) {
      await updateTableMeta(payload);
      message.success('更新成功');
    } else {
      await addTableMeta(payload);
      message.success('新增成功');
    }
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || (isEdit.value ? '更新失败' : '新增失败'));
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

watch(visible, (val) => {
  if (!val) return;
  if (isEdit.value && props.data?.id) {
    loadDetail(props.data.id);
  } else {
    resetForm();
  }
});
</script>
