<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Table,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  createDictData,
  deleteDictData,
  getDictDataDetail,
  listDictDataPage,
  updateDictData,
  type DictDataResult,
} from '#/api/sys/dict';

const props = defineProps<{
  open: boolean;
  dictTypeCode: string;
  dictTypeName: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success'): void;
}>();

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const modalTitle = computed(() => `${props.dictTypeName} (${props.dictTypeCode}) - 字典数据`);

const tableData = ref<DictDataResult[]>([]);
const loading = ref(false);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const statusSwitchLoading = ref<Record<number, boolean>>({});

const formModalVisible = ref(false);
const formLoading = ref(false);
const editId = ref<number>();
const formRef = ref();
const formState = ref({
  dictLabel: '',
  dictValue: '',
  sortOrder: 0,
  isEnabled: 1,
  languageType: 'zh_CN',
  remarks: '',
});

const isEdit = computed(() => !!editId.value);
const formTitle = computed(() => (isEdit.value ? '编辑字典数据' : '新建字典数据'));

const rules = {
  dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
};

const languageTypeOptions = [
  { label: '简体中文', value: 'zh_CN' },
  { label: 'English', value: 'en_US' },
  { label: '繁體中文', value: 'zh_TW' },
];

const columns = [
  { title: '字典标签', dataIndex: 'dictLabel', key: 'dictLabel', width: 140 },
  { title: '字典值', dataIndex: 'dictValue', key: 'dictValue', width: 140 },
  { title: '语言', dataIndex: 'languageType', key: 'languageType', width: 120 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 90, align: 'center' as const },
  { title: '是否启用', key: 'isEnabled', width: 120, align: 'center' as const },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const },
];

const toIntFlag = (val: unknown, defaultVal = 0) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (val === true || val === 'true') return 1;
  if (val === false || val === 'false') return 0;
  const n = Number(val);
  return Number.isNaN(n) ? defaultVal : n;
};

const fetchData = async () => {
  if (!props.dictTypeCode) return;
  loading.value = true;
  try {
    const res = await listDictDataPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      dictType: props.dictTypeCode,
    });
    tableData.value = res.rows || [];
    total.value = res.total || 0;
  } catch (e: any) {
    message.error(e?.message || e?.response?.data?.message || '加载字典数据失败');
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pagination: { current: number; pageSize: number }) => {
  pageNum.value = pagination.current;
  pageSize.value = pagination.pageSize;
  fetchData();
};

const resetForm = () => {
  formState.value = {
    dictLabel: '',
    dictValue: '',
    sortOrder: 0,
    isEnabled: 1,
    languageType: 'zh_CN',
    remarks: '',
  };
  formRef.value?.resetFields();
};

const handleAdd = () => {
  editId.value = undefined;
  resetForm();
  formModalVisible.value = true;
};

const handleEdit = async (record: DictDataResult) => {
  if (!record.id) return;
  editId.value = record.id;
  formLoading.value = true;
  try {
    const data = await getDictDataDetail(record.id);
    formState.value = {
      dictLabel: data.dictLabel || '',
      dictValue: data.dictValue || '',
      sortOrder: data.sortOrder ?? 0,
      isEnabled: data.isEnabled ?? 1,
      languageType: data.languageType || 'zh_CN',
      remarks: data.remarks || '',
    };
    formModalVisible.value = true;
  } catch {
    message.error('加载详情失败');
  } finally {
    formLoading.value = false;
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  formLoading.value = true;
  try {
    if (isEdit.value) {
      await updateDictData({ id: editId.value, dictType: props.dictTypeCode, ...formState.value });
      message.success('更新成功');
    } else {
      await createDictData({ dictType: props.dictTypeCode, ...formState.value });
      message.success('创建成功');
    }
    formModalVisible.value = false;
    emit('success');
    fetchData();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  } finally {
    formLoading.value = false;
  }
};

const handleToggleEnabled = (record: DictDataResult, checked: boolean) => {
  if (!record.id) return;
  const nextEnabled = checked ? 1 : 0;
  const nextStatus = nextEnabled === 1 ? '0' : '1';
  const basePayload = {
    id: record.id,
    dictLabel: record.dictLabel,
    dictValue: record.dictValue,
    dictType: record.dictType || props.dictTypeCode,
    sortOrder: record.sortOrder ?? 0,
    languageType: record.languageType || 'zh_CN',
    remarks: record.remarks || '',
  };

  Modal.confirm({
    title: checked ? '确认启用' : '确认停用',
    content: `确定将“${record.dictLabel}”设置为${checked ? '启用' : '停用'}吗？`,
    onOk: async () => {
      statusSwitchLoading.value[record.id!] = true;
      try {
        await updateDictData({
          ...basePayload,
          status: nextStatus,
        });
        record.isEnabled = nextEnabled;
        message.success('状态更新成功');
      } catch (e: any) {
        message.error(e?.message || '状态更新失败');
      } finally {
        statusSwitchLoading.value[record.id!] = false;
      }
    },
  });
};

const handleDelete = (record: DictDataResult) => {
  if (!record.id) return;
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: `确定删除字典数据“${record.dictLabel}”吗？`,
    onOk: async () => {
      try {
        await deleteDictData(record.id!);
        message.success($t('page.common.deleteSuccess'));
        emit('success');
        fetchData();
      } catch {
        message.error($t('page.common.deleteFailed'));
      }
    },
  });
};

const handleDeleteFromForm = () => {
  if (!editId.value) return;
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: '确定删除当前字典数据吗？',
    onOk: async () => {
      try {
        await deleteDictData(editId.value);
        message.success($t('page.common.deleteSuccess'));
        formModalVisible.value = false;
        emit('success');
        fetchData();
      } catch {
        message.error($t('page.common.deleteFailed'));
      }
    },
  });
};

const handleCancel = () => {
  visible.value = false;
};

watch(
  [() => props.open, () => props.dictTypeCode],
  ([isOpen, dictTypeCode]) => {
    if (isOpen && dictTypeCode) {
      pageNum.value = 1;
      fetchData();
    }
  },
  { immediate: true },
);

const getLanguageTypeLabel = (value?: string) => {
  const option = languageTypeOptions.find((o) => o.value === value);
  return option ? option.label : (value || '-');
};

const open = async (id?: number) => {
  if (typeof id === 'number') {
    visible.value = true;
    await handleEdit({ id } as DictDataResult);
    return;
  }
  visible.value = true;
};

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    width="900px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="dict-data-modal-content">
      <div class="toolbar mb-4">
        <Button type="primary" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="{
          current: pageNum,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="id"
        :scroll="{ x: 900 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'languageType'">
            {{ getLanguageTypeLabel(record.languageType) }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
            <Switch
              :checked="toIntFlag(record.isEnabled, 0) === 1"
              :loading="statusSwitchLoading[record.id]"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked: boolean) => handleToggleEnabled(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleEdit(record)">
              {{ $t('page.common.edit') }}
            </Button>
            <Button type="link" size="small" danger @click="handleDelete(record)">
              {{ $t('page.common.delete') }}
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <Modal
      v-model:open="formModalVisible"
      :title="formTitle"
      :confirm-loading="formLoading"
      width="520px"
      @ok="handleSubmit"
      @cancel="formModalVisible = false"
    >
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <Button v-if="isEdit" danger @click="handleDeleteFromForm">
            逻辑删除
          </Button>
          <div style="margin-left: auto; display: flex; gap: 8px;">
            <Button @click="formModalVisible = false">取消</Button>
            <Button type="primary" :loading="formLoading" @click="handleSubmit">保存</Button>
          </div>
        </div>
      </template>

      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        class="dict-data-form"
      >
        <Form.Item label="字典标签" name="dictLabel">
          <Input v-model:value="formState.dictLabel" placeholder="如：男" />
        </Form.Item>
        <Form.Item label="字典值" name="dictValue">
          <Input v-model:value="formState.dictValue" placeholder="如：1" />
        </Form.Item>
        <Form.Item label="语言类型" name="languageType">
          <Select v-model:value="formState.languageType" :options="languageTypeOptions" style="width: 100%" />
        </Form.Item>
        <Form.Item label="排序" name="sortOrder">
          <InputNumber v-model:value="formState.sortOrder" :min="0" :max="9999" style="width: 100%" />
        </Form.Item>
        <Form.Item label="状态" name="isEnabled">
          <Switch
            v-model:checked="formState.isEnabled"
            checked-children="启用"
            un-checked-children="停用"
            :checked-value="1"
            :unchecked-value="0"
          />
        </Form.Item>
        <Form.Item label="备注" name="remarks">
          <Input.TextArea v-model:value="formState.remarks" placeholder="请输入备注" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </Modal>
</template>

<style scoped>
.dict-data-modal-content {
  padding: 16px 0;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.dict-data-form {
  margin-top: 16px;
}
</style>
