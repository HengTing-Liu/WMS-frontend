<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="720px"
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
        <Input v-model:value="formData.tableCode" disabled />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="分组编码" name="groupCode" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Input v-model:value="formData.groupCode" :disabled="isEdit" :maxlength="50" placeholder="例如 basicInfo" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="分组标题" name="groupTitle" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Input v-model:value="formData.groupTitle" :maxlength="100" placeholder="例如 基本信息" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="容器类型" name="groupType" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Select v-model:value="formData.groupType">
              <SelectOption value="card">Card</SelectOption>
              <SelectOption value="collapse">Collapse</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="排序" name="sortOrder" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <InputNumber v-model:value="formData.sortOrder" :min="1" :max="9999" style="width: 100%" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="默认展开" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Switch v-model:checked="defaultOpenChecked" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="状态" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Switch v-model:checked="statusChecked" />
          </FormItem>
        </Col>
      </Row>

      <FormItem label="备注" name="remarks">
        <Input.TextArea v-model:value="formData.remarks" :rows="4" :maxlength="255" placeholder="记录这个分组的用途或说明" />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectOption,
  Switch,
  message,
} from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import {
  addGroupMeta,
  getGroupMetaById,
  updateGroupMeta,
  type GroupMetaApi,
} from '#/api/system/groupMeta';

const props = defineProps<{
  mode: 'add' | 'edit';
  data?: GroupMetaApi.GroupMeta | null;
  tableCode?: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => props.mode === 'edit');
const modalTitle = computed(() => (isEdit.value ? '编辑分组元数据' : '新增分组元数据'));

const formData = reactive<GroupMetaApi.GroupMeta>({
  id: undefined,
  tableCode: '',
  groupCode: '',
  groupTitle: '',
  groupType: 'card',
  sortOrder: 1,
  defaultOpen: 1,
  status: 1,
  remarks: '',
});

const formRules: Record<string, Rule[]> = {
  tableCode: [{ required: true, message: '请选择表编码', trigger: 'blur' }],
  groupCode: [{ required: true, message: '请输入分组编码', trigger: 'blur' }],
  groupTitle: [{ required: true, message: '请输入分组标题', trigger: 'blur' }],
  groupType: [{ required: true, message: '请选择容器类型', trigger: 'change' }],
};

const defaultOpenChecked = computed({
  get: () => Number(formData.defaultOpen ?? 1) === 1,
  set: (value: boolean) => {
    formData.defaultOpen = value ? 1 : 0;
  },
});

const statusChecked = computed({
  get: () => Number(formData.status ?? 1) === 1,
  set: (value: boolean) => {
    formData.status = value ? 1 : 0;
  },
});

function resetForm() {
  formData.id = undefined;
  formData.tableCode = props.tableCode || '';
  formData.groupCode = '';
  formData.groupTitle = '';
  formData.groupType = 'card';
  formData.sortOrder = 1;
  formData.defaultOpen = 1;
  formData.status = 1;
  formData.remarks = '';
  formRef.value?.clearValidate();
}

async function loadDetail() {
  if (!props.data?.id) {
    resetForm();
    return;
  }
  loading.value = true;
  try {
    const detail = await getGroupMetaById(props.data.id);
    formData.id = detail?.id;
    formData.tableCode = detail?.tableCode || props.tableCode || '';
    formData.groupCode = detail?.groupCode || '';
    formData.groupTitle = detail?.groupTitle || '';
    formData.groupType = detail?.groupType || 'card';
    formData.sortOrder = Number(detail?.sortOrder ?? 1);
    formData.defaultOpen = Number(detail?.defaultOpen ?? 1);
    formData.status = Number(detail?.status ?? 1);
    formData.remarks = detail?.remarks || '';
  } catch (error: any) {
    message.error(error?.message || '加载分组详情失败');
  } finally {
    loading.value = false;
  }
}

watch(
  () => visible.value,
  async (open) => {
    if (!open) return;
    resetForm();
    if (isEdit.value && props.data?.id) {
      await loadDetail();
    }
  },
  { immediate: true },
);

watch(
  () => props.tableCode,
  (value) => {
    if (!isEdit.value) {
      formData.tableCode = value || '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();
  loading.value = true;
  try {
    const payload = {
      ...formData,
      tableCode: props.tableCode || formData.tableCode,
      groupCode: formData.groupCode.trim(),
      groupTitle: formData.groupTitle.trim(),
      remarks: formData.remarks?.trim() || '',
    };

    if (isEdit.value && formData.id) {
      await updateGroupMeta(formData.id, payload);
      message.success('分组更新成功');
    } else {
      await addGroupMeta(payload);
      message.success('分组创建成功');
    }
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '保存分组失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}
</script>
