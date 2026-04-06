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
        <Input
          v-model:value="formData.tableName"
          placeholder="请输入表名称"
          :maxlength="100"
        />
      </FormItem>
      <FormItem label="所属模块" name="module">
        <Select v-model:value="formData.module" placeholder="请选择所属模块">
          <Select.Option value="base">基础</Select.Option>
          <Select.Option value="wms">WMS</Select.Option>
          <Select.Option value="sys">系统</Select.Option>
        </Select>
      </FormItem>
      <FormItem label="实体类名">
        <Input
          v-model:value="formData.entityClass"
          placeholder="请输入实体类名"
        />
      </FormItem>
      <FormItem label="服务类名">
        <Input
          v-model:value="formData.serviceClass"
          placeholder="请输入服务类名"
        />
      </FormItem>
      <FormItem label="权限标识">
        <Input
          v-model:value="formData.permissionCode"
          placeholder="请输入权限标识"
        />
      </FormItem>
      <FormItem label="默认页大小">
        <InputNumber
          v-model:value="formData.pageSize"
          :min="1"
          :max="100"
          style="width: 100%"
        />
      </FormItem>
      <FormItem label="是否树形">
        <RadioGroup v-model:value="formData.isTree">
          <Radio :value="1">是</Radio>
          <Radio :value="0">否</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem label="状态">
        <Switch
          v-model:checked="formData.status"
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
  updateTableMeta,
  getTableMetaById,
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
  pageSize: 20,
  isTree: 0,
  status: 1,
  remark: '',
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
  module: [
    { required: true, message: '请选择所属模块', trigger: 'change' },
  ],
};

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
    const valid = await formRef.value?.validate();
    if (!valid) return;

    loading.value = true;
    if (isEdit.value) {
      await updateTableMeta(formData);
      message.success('更新成功');
    } else {
      await addTableMeta(formData);
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

// 监听 visible 变化，打开时如果是编辑模式则加载详情
import { watch } from 'vue';
watch(visible, (val) => {
  if (val) {
    if (isEdit.value && props.data?.id) {
      loadDetail(props.data.id);
    } else {
      // 重置表单
      formRef.value?.resetFields();
      Object.assign(formData, {
        id: undefined,
        tableCode: '',
        tableName: '',
        module: '',
        entityClass: '',
        serviceClass: '',
        permissionCode: '',
        pageSize: 20,
        isTree: 0,
        status: 1,
        remark: '',
      });
    }
  }
});
</script>
