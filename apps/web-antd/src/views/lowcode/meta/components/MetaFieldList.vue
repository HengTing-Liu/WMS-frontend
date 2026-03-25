<template>
  <div class="meta-field-list">
    <Modal
      v-model:open="visible"
      :title="`${$t('page.lowcode.meta.fieldManagement')} - ${tableCode}`"
      width="1200px"
      :footer="null"
      @cancel="handleClose"
    >
      <div class="field-list-container">
        <!-- 操作按钮栏 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Space>
              <Button type="primary" @click="handleAdd">
                <IconifyIcon icon="mdi:plus" />
                新增字段
              </Button>
              <Button @click="handleBatchImport">
                <IconifyIcon icon="mdi:import" />
                批量导入
              </Button>
              <Button danger @click="handleBatchDelete">
                <IconifyIcon icon="mdi:delete-sweep" />
                批量删除
              </Button>
            </Space>
          </Col>
          <Col :span="12" class="text-right">
            <Space>
              <Input
                v-model:value="searchKeyword"
                :placeholder="$t('page.lowcode.meta.searchFieldPlaceholder')"
                style="width: 200px"
                allow-clear
                @press-enter="handleSearch"
              >
                <template #prefix>
                  <IconifyIcon icon="mdi:magnify" />
                </template>
              </Input>
              <Button type="primary" @click="handleSearch">{{ $t('page.common.search') }}</Button>
            </Space>
          </Col>
        </Row>

        <!-- 字段列表 -->
        <Table
          :columns="columns"
          :data-source="filteredFields"
          :loading="loading"
          :pagination="false"
          row-key="field"
          :row-selection="rowSelection"
          :custom-row="customRow"
          :scroll="{ y: 500 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'isShowInList'">
              <Switch v-model:checked="record.isShowInList" size="small" />
            </template>
            <template v-if="column.key === 'isShowInForm'">
              <Switch v-model:checked="record.isShowInForm" size="small" />
            </template>
            <template v-if="column.key === 'isRequired'">
              <Switch v-model:checked="record.isRequired" size="small" />
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Button size="small" type="link" @click="handleEdit(record)">
                  <IconifyIcon icon="mdi:pencil" />
                  编辑
                </Button>
                <Button
                  size="small"
                  type="link"
                  danger
                  @click="handleDelete(record)"
                >
                  <IconifyIcon icon="mdi:delete" />
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <!-- 底部按钮 -->
        <div class="footer-actions">
          <Space>
            <Button @click="handleClose">{{ $t('page.common.cancel') }}</Button>
            <Button type="primary" @click="handleSave">
              <IconifyIcon icon="mdi:content-save" />
              保存
            </Button>
          </Space>
        </div>
      </div>
    </Modal>

    <!-- 字段编辑弹窗 -->
    <Modal
      v-model:open="editModalVisible"
      :title="isEditing ? $t('page.lowcode.meta.editColumnTitle') : $t('page.lowcode.meta.addColumnTitle')"
      width="800px"
      @ok="handleEditSubmit"
      @cancel="handleEditCancel"
    >
      <Form :model="editForm" :rules="editRules" layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.fieldName')" name="field">
              <Input
                v-model:value="editForm.field"
                :placeholder="$t('page.lowcode.meta.fieldNamePlaceholder')"
                :disabled="isEditing"
                allow-clear
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.fieldTitle')" name="title">
              <Input
                v-model:value="editForm.title"
                :placeholder="$t('page.lowcode.meta.fieldTitlePlaceholder')"
                allow-clear
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.dataType')" name="dataType">
              <Select v-model:value="editForm.dataType" :placeholder="$t('page.lowcode.meta.selectDataType')">
                <SelectOption
                  v-for="item in DATA_TYPES"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.formType')" name="formType">
              <Select v-model:value="editForm.formType" :placeholder="$t('page.lowcode.meta.selectFormType')">
                <SelectOption
                  v-for="item in FORM_TYPES"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.dictType')" name="dictType">
              <Input
                v-model:value="editForm.dictType"
                placeholder="如：sys_user_status"
                allow-clear
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.columnWidth')" name="width">
              <InputNumber
                v-model:value="editForm.width"
                :min="50"
                :max="500"
                style="width: 100%"
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem :label="$t('page.lowcode.meta.placeholder')" name="placeholder">
          <Input
            v-model:value="editForm.placeholder"
            :placeholder="$t('page.lowcode.meta.placeholderPlaceholder')"
            allow-clear
          />
        </FormItem>

        <FormItem :label="$t('page.lowcode.meta.defaultValue')" name="defaultValue">
          <Input
            v-model:value="editForm.defaultValue"
            :placeholder="$t('page.lowcode.meta.defaultValuePlaceholder')"
            allow-clear
          />
        </FormItem>

        <Row :gutter="16">
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.showInList')">
              <Switch v-model:checked="editForm.isShowInList" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.showInForm')">
              <Switch v-model:checked="editForm.isShowInForm" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.required')">
              <Switch v-model:checked="editForm.isRequired" />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.searchable')">
              <Switch v-model:checked="editForm.isSearchable" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.sortable')">
              <Switch v-model:checked="editForm.isSortable" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label="$t('page.lowcode.meta.sortOrder')">
              <InputNumber
                v-model:value="editForm.sortOrder"
                :min="0"
                style="width: 100%"
              />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Modal>

    <!-- 批量导入弹窗 -->
    <Modal
      v-model:open="importModalVisible"
      :title="$t('page.lowcode.meta.batchImportColumnTitle')"
      width="900px"
      @ok="handleImportSubmit"
      @cancel="handleImportCancel"
    >
      <Alert message="$t('page.lowcode.meta.importFromDbHint')" description="$t('page.lowcode.meta.importHint')" type="info" show-icon class="mb-4" />

      <Table
        :columns="importColumns"
        :data-source="importFields"
        :pagination="false"
        row-key="field"
        :row-selection="importRowSelection"
        :scroll="{ y: 400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'exists' ? 'warning' : 'success'">
              {{ record.status === 'exists' ? $t('page.lowcode.meta.exists') : $t('page.lowcode.meta.new') }}
            </Tag>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Alert,
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { DATA_TYPES, FORM_TYPES } from '../constants/meta';
import type { ColumnMeta } from '../types/meta';
import {
  getColumnList,
  addColumn,
  updateColumn,
  deleteColumn,
  batchDeleteColumn,
  importColumnsFromDb,
  saveColumnList,
} from '#/api/lowcode/meta';

interface Props {
  modelValue: boolean;
  tableCode: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save': [fields: ColumnMeta[]];
}>();

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const loading = ref(false);
const searchKeyword = ref('');
const fields = ref<ColumnMeta[]>([]);
const selectedRowKeys = ref<string[]>([]);

// 编辑弹窗
const editModalVisible = ref(false);
const isEditing = ref(false);
const editForm = reactive<Partial<ColumnMeta>>({
  tableCode: '',
  field: '',
  title: '',
  dataType: 'string',
  formType: 'input',
  isShowInList: true,
  isShowInForm: true,
  isSearchable: false,
  isSortable: false,
  isRequired: false,
  sortOrder: 0,
});

const editRules = {
  field: [{ required: true, message: () => $t('page.lowcode.meta.inputFieldName'), trigger: 'blur' }],
  title: [{ required: true, message: () => $t('page.lowcode.meta.inputFieldTitle'), trigger: 'blur' }],
  dataType: [{ required: true, message: () => $t('page.lowcode.meta.selectDataType'), trigger: 'change' }],
  formType: [{ required: true, message: () => $t('page.lowcode.meta.selectFormType'), trigger: 'change' }],
};

// 导入弹窗
const importModalVisible = ref(false);
const importFields = ref<any[]>([]);
const selectedImportKeys = ref<string[]>([]);

// 过滤后的字段列表
const filteredFields = computed(() => {
  if (!searchKeyword.value) {
    return fields.value;
  }
  return fields.value.filter(
    (item) =>
      item.field.includes(searchKeyword.value) ||
      item.title.includes(searchKeyword.value)
  );
});

// 表格列定义
const columns = [
  {
    title: () => $t('page.lowcode.meta.dragColumn'),
    key: 'drag',
    width: 50,
    align: 'center' as const,
  },
  {
    title: () => $t('page.lowcode.meta.fieldName'),
    dataIndex: 'field',
    key: 'field',
    width: 150,
  },
  {
    title: () => $t('page.lowcode.meta.fieldTitle'),
    dataIndex: 'title',
    key: 'title',
    width: 150,
  },
  {
    title: () => $t('page.lowcode.meta.dataType'),
    dataIndex: 'dataType',
    key: 'dataType',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.formType'),
    dataIndex: 'formType',
    key: 'formType',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.showInList'),
    dataIndex: 'isShowInList',
    key: 'isShowInList',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.showInForm'),
    dataIndex: 'isShowInForm',
    key: 'isShowInForm',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.required'),
    dataIndex: 'isRequired',
    key: 'isRequired',
    width: 80,
  },
  {
    title: () => $t('page.common.operation'),
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
];

// 导入表格列定义
const importColumns = [
  {
    title: () => $t('page.lowcode.meta.fieldName'),
    dataIndex: 'field',
    key: 'field',
  },
  {
    title: () => $t('page.lowcode.meta.dataType'),
    dataIndex: 'dataType',
    key: 'dataType',
  },
  {
    title: () => $t('page.lowcode.meta.comment'),
    dataIndex: 'comment',
    key: 'comment',
  },
  {
    title: () => $t('page.common.status'),
    dataIndex: 'status',
    key: 'status',
  },
];

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

const importRowSelection = computed(() => ({
  selectedRowKeys: selectedImportKeys.value,
  onChange: (keys: string[]) => {
    selectedImportKeys.value = keys;
  },
}));

// 自定义行属性（用于拖拽）
const customRow = (record: ColumnMeta, index: number) => {
  return {
    style: {
      cursor: 'move',
    },
    onMouseenter: (event: MouseEvent) => {
      // TODO: 实现拖拽逻辑
    },
  };
};

// 加载字段列表
const loadFields = async () => {
  loading.value = true;
  try {
    const res = await getColumnList({
      tableCode: props.tableCode,
    });
    fields.value = res.rows || [];
  } catch (error) {
    console.error($t('page.lowcode.meta.loadFieldListFail'), error);
    message.error($t('page.lowcode.meta.loadFieldListFail'));
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  // 过滤逻辑在 filteredFields computed 中处理
};

// 新增字段
const handleAdd = () => {
  isEditing.value = false;
  Object.assign(editForm, {
    tableCode: props.tableCode,
    field: '',
    title: '',
    dataType: 'string',
    formType: 'input',
    dictType: '',
    width: 150,
    placeholder: '',
    defaultValue: '',
    isShowInList: true,
    isShowInForm: true,
    isSearchable: false,
    isSortable: false,
    isRequired: false,
    sortOrder: fields.value.length,
  });
  editModalVisible.value = true;
};

// 编辑字段
const handleEdit = (record: ColumnMeta) => {
  isEditing.value = true;
  Object.assign(editForm, record);
  editModalVisible.value = true;
};

// 删除字段
const handleDelete = async (record: ColumnMeta) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.lowcode.meta.confirmDeleteField', { field: record.field }),
    onOk: async () => {
      try {
        if (record.id) {
          await deleteColumn(record.id);
        }
        const index = fields.value.findIndex((f) => f.field === record.field);
        if (index > -1) {
          fields.value.splice(index, 1);
        }
        message.success($t('page.message.deleteSuccess'));
      } catch (error) {
        console.error($t('page.message.deleteFail'), error);
        message.error($t('page.message.deleteFail'));
      }
    },
  });
};

//批量删除
const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.lowcode.meta.selectFieldsFirst'));
    return;
  }

  Modal.confirm({
    title: $t('page.lowcode.meta.confirmBatchDelete'),
    content: $t('page.lowcode.meta.confirmBatchDeleteFields', { count: selectedRowKeys.value.length }),
    onOk: async () => {
      try {
        const idsToDelete = fields.value
          .filter((f) => selectedRowKeys.value.includes(f.field))
          .map((f) => f.id)
          .filter((id) => id) as number[];

        if (idsToDelete.length > 0) {
          await batchDeleteColumn(idsToDelete);
        }

        fields.value = fields.value.filter(
          (f) => !selectedRowKeys.value.includes(f.field)
        );
        selectedRowKeys.value = [];
        message.success($t('page.lowcode.meta.batchDeleteSuccess'));
      } catch (error) {
        console.error($t('page.lowcode.meta.batchDeleteFail'), error);
        message.error($t('page.lowcode.meta.batchDeleteFail'));
      }
    },
  });
};

// 批量导入
const handleBatchImport = async () => {
  try {
    const res = await importColumnsFromDb(props.tableCode);
    const dbFields = res?.data || [];

    // 标记字段状态
    importFields.value = dbFields.map((dbField: any) => ({
      ...dbField,
      status: fields.value.some((f) => f.field === dbField.field)
        ? 'exists'
        : 'new',
    }));

    // 默认选中新增字段
    selectedImportKeys.value = importFields.value
      .filter((f) => f.status === 'new')
      .map((f) => f.field);

    importModalVisible.value = true;
  } catch (error) {
    console.error($t('page.lowcode.meta.getDbFieldsFail'), error);
    message.error($t('page.lowcode.meta.getDbFieldsFail'));
  }
};

// 导入确认
const handleImportSubmit = () => {
  if (selectedImportKeys.value.length === 0) {
    message.warning($t('page.lowcode.meta.selectAtLeastOneField'));
    return;
  }

  const selectedFields = importFields.value.filter((f) =>
    selectedImportKeys.value.includes(f.field)
  );

  selectedFields.forEach((importField) => {
    const existingIndex = fields.value.findIndex(
      (f) => f.field === importField.field
    );

    const newField: ColumnMeta = {
      tableCode: props.tableCode,
      field: importField.field,
      title: importField.comment || importField.field,
      dataType: importField.dataType.split('(')[0] as any,
      formType: 'input',
      isShowInList: true,
      isShowInForm: true,
      isSearchable: false,
      isSortable: false,
      isRequired: false,
      sortOrder: fields.value.length,
    };

    if (existingIndex > -1) {
      // 更新已存在的字段
      fields.value[existingIndex] = { ...fields.value[existingIndex], ...newField };
    } else {
      // 新增字段
      fields.value.push(newField);
    }
  });

  importModalVisible.value = false;
  selectedImportKeys.value = [];
  message.success($t('page.lowcode.meta.importSuccess', { count: selectedFields.length }));
};

// 编辑确认
const handleEditSubmit = async () => {
  if (!editForm.field || !editForm.title) {
    message.warning($t('page.common.requiredFieldsHint'));
    return;
  }

  try {
    if (isEditing.value) {
      // 更新
      const index = fields.value.findIndex((f) => f.field === editForm.field);
      if (index > -1) {
        const updatedField = { ...fields.value[index], ...editForm };
        if (updatedField.id) {
          await updateColumn(updatedField);
        }
        fields.value[index] = updatedField;
      }
      message.success($t('page.message.updateSuccess'));
    } else {
      // 新增
      const existing = fields.value.find((f) => f.field === editForm.field);
      if (existing) {
        message.warning($t('page.lowcode.meta.fieldNameExists'));
        return;
      }
      const newField = { ...editForm, tableCode: props.tableCode } as ColumnMeta;
      await addColumn(newField);
      fields.value.push(newField);
      message.success($t('page.message.addSuccess'));
    }
    editModalVisible.value = false;
  } catch (error) {
    console.error($t('page.message.saveFail'), error);
    message.error($t('page.message.saveFail'));
  }
};

// 编辑取消
const handleEditCancel = () => {
  editModalVisible.value = false;
};

// 导入取消
const handleImportCancel = () => {
  importModalVisible.value = false;
  selectedImportKeys.value = [];
};

// 保存
const handleSave = async () => {
  try {
    await saveColumnList(fields.value);
    emit('save', fields.value);
    visible.value = false;
    message.success($t('page.message.saveSuccess'));
  } catch (error) {
    console.error($t('page.message.saveFail'), error);
    message.error($t('page.message.saveFail'));
  }
};

// 关闭
const handleClose = () => {
  visible.value = false;
};

// 监听弹窗打开，加载数据
const watchVisible = computed(() => props.modelValue);
watchVisible.value;

// 当弹窗打开时加载数据
import { watch } from 'vue';
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      loadFields();
    }
  }
);
</script>

<style scoped lang="less">
.meta-field-list {
  .field-list-container {
    .footer-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }
  }
}

.text-right {
  text-align: right;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
