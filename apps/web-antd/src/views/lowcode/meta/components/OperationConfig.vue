<template>
  <div class="operation-config">
    <Modal
      v-model:open="visible"
      :title="$t('page.lowcode.meta.operationConfigTitle') + ' - ' + tableCode"
      width="1000px"
      :footer="null"
      @cancel="handleClose"
    >
      <div class="operation-config-container">
        <!-- 操作按钮栏 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Space>
              <Button type="primary" @click="handleAdd">
                <IconifyIcon icon="mdi:plus" />
                $t('page.lowcode.meta.addOperation')
              </Button>
              <Button danger @click="handleBatchDelete">
                <IconifyIcon icon="mdi:delete-sweep" />
                $t('page.lowcode.meta.batchDelete') + $t('page.common.delete')
              </Button>
            </Space>
          </Col>
        </Row>

        <!-- 操作列表 -->
        <Table
          class="drag-table"
          :columns="columns"
          :data-source="operations"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :row-selection="rowSelection"
          :scroll="{ y: 400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'drag'">
              <IconifyIcon icon="material-symbols:drag-indicator" class="drag-icon" />
            </template>
            <template v-if="column.key === 'operationType'">
              <Tag :color="getOperationTypeColor(record.operationType)">
                {{ getOperationTypeLabel(record.operationType) }}
              </Tag>
            </template>
            <template v-if="column.key === 'position'">
              <Tag :color="record.position === 'toolbar' ? 'blue' : 'green'">
                {{ record.position === 'toolbar' ? $t('page.lowcode.meta.toolbar') : $t('page.lowcode.meta.inline') }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Button size="small" type="link" @click="handleEdit(record)">
                  <IconifyIcon icon="mdi:pencil" />
                  {{ $t('page.common.edit') }}
                </Button>
                <Button
                  size="small"
                  type="link"
                  danger
                  @click="handleDelete(record)"
                >
                  <IconifyIcon icon="mdi:delete" />
                  $t('page.common.delete')
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <!-- 底部按钮 -->
        <div class="footer-actions">
          <Space>
            <Button @click="handleClose">{{ $t('page.common.cancel') }}</Button>
          </Space>
        </div>
      </div>
    </Modal>

    <!-- 操作编辑弹窗 -->
    <Modal
      v-model:open="editModalVisible"
      :title="isEditing ? $t('page.lowcode.meta.editOperation') : $t('page.lowcode.meta.addOperation')"
      width="700px"
      @ok="handleEditSubmit"
      @cancel="handleEditCancel"
    >
      <Form :model="editForm" :rules="editRules" layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.operationCode')" name="operationCode">
              <Input
                v-model:value="editForm.operationCode"
                :placeholder="$t('page.lowcode.meta.operationCodeExample')"
                :disabled="isEditing"
                allow-clear
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="$t('page.lowcode.meta.operationName')" name="operationName">
              <Input
                v-model:value="editForm.operationName"
                :placeholder="$t('page.lowcode.meta.operationNameExample')"
                allow-clear
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="$t('page.lowcode.meta.operationType')" name="operationType">
              <Select v-model:value="editForm.operationType" :placeholder="$t('page.lowcode.meta.selectOperationType')">
                <SelectOption
                  v-for="item in OPERATION_TYPES"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.icon')" name="icon">
              <Input
                v-model:value="editForm.icon"
                :placeholder="$t('page.lowcode.meta.iconExample')"
                allow-clear
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.position')" name="position">
              <Select v-model:value="editForm.position" :placeholder="$t('page.lowcode.meta.selectPosition')">
                <SelectOption
                  v-for="item in POSITION_OPTIONS"
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
            <FormItem :label="$t('page.lowcode.meta.permission')" name="permission">
              <Input
                v-model:value="editForm.permission"
                :placeholder="$t('page.lowcode.meta.permissionExample')"
                allow-clear
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem :label="$t('page.lowcode.meta.sortOrder')" name="sortOrder">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
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
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { OPERATION_TYPES, POSITION_OPTIONS } from '../constants/meta';
import type { TableOperation } from '../types/meta';
import {
  getOperationList,
  addOperation,
  updateOperation,
  deleteOperation,
  batchDeleteOperation,
  sortOperations,
} from '#/api/lowcode/meta';
import { useSortable } from '@vben/hooks';

interface Props {
  modelValue: boolean;
  tableCode: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const loading = ref(false);
const operations = ref<TableOperation[]>([]);
const selectedRowKeys = ref<string[]>([]);

// 编辑弹窗
const editModalVisible = ref(false);
const isEditing = ref(false);
const editForm = reactive<Partial<TableOperation>>({
  tableCode: '',
  operationCode: '',
  operationName: '',
  operationType: 'button',
  icon: '',
  permission: '',
  position: 'toolbar',
  sortOrder: 0,
});

const editRules = {
  operationCode: [{ required: true, message: () => $t('page.lowcode.meta.inputOperationCode'), trigger: 'blur' }],
  operationName: [{ required: true, message: () => $t('page.lowcode.meta.inputOperationName'), trigger: 'blur' }],
  operationType: [{ required: true, message: () => $t('page.lowcode.meta.selectOperationType'), trigger: 'change' }],
  position: [{ required: true, message: () => $t('page.lowcode.meta.selectPosition'), trigger: 'change' }],
};

// 表格列定义
const columns = [
  {
    title: '',
    key: 'drag',
    width: 50,
    align: 'center',
  },
  {
    title: () => $t('page.lowcode.meta.operationCode'),
    dataIndex: 'operationCode',
    key: 'operationCode',
    width: 150,
  },
  {
    title: () => $t('page.lowcode.meta.operationName'),
    dataIndex: 'operationName',
    key: 'operationName',
    width: 120,
  },
  {
    title: () => $t('page.lowcode.meta.operationType'),
    dataIndex: 'operationType',
    key: 'operationType',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.icon'),
    dataIndex: 'icon',
    key: 'icon',
    width: 100,
  },
  {
    title: () => $t('page.lowcode.meta.permission'),
    dataIndex: 'permission',
    key: 'permission',
    width: 150,
    ellipsis: true,
  },
  {
    title: () => $t('page.lowcode.meta.position'),
    dataIndex: 'position',
    key: 'position',
    width: 80,
  },
  {
    title: () => $t('page.lowcode.meta.sortNo'),
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 80,
  },
  {
    title: () => $t('page.common.action'),
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
];

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

// Get operation type color
const getOperationTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    button: 'blue',
    link: 'green',
    icon: 'orange',
  };
  return colorMap[type] || 'default';
};

// Get operation type label
const getOperationTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    button: $t('page.lowcode.meta.button'),
    link: $t('page.lowcode.meta.link'),
    icon: $t('page.lowcode.meta.iconType'),
  };
  return labelMap[type] || type;
};

// Load operations list
const loadOperations = async () => {
  loading.value = true;
  try {
    const res = await getOperationList({
      tableCode: props.tableCode,
    });
    operations.value = res.rows || [];
  } catch (error) {
    console.error($t('page.lowcode.meta.loadOperationsFail'), error);
    message.error($t('page.lowcode.meta.loadOperationsFail'));
  } finally {
    loading.value = false;
  }
};

// Add operation
const handleAdd = () => {
  isEditing.value = false;
  Object.assign(editForm, {
    tableCode: props.tableCode,
    operationCode: '',
    operationName: '',
    operationType: 'button',
    icon: '',
    permission: '',
    position: 'toolbar',
    sortOrder: operations.value.length,
  });
  editModalVisible.value = true;
};

// 编辑操作
const handleEdit = (record: TableOperation) => {
  isEditing.value = true;
  Object.assign(editForm, record);
  editModalVisible.value = true;
};

// Delete operation
const handleDelete = (record: TableOperation) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.lowcode.meta.confirmDeleteOperation', { name: record.operationName }),
    onOk: async () => {
      try {
        if (record.id) {
          await deleteOperation(record.id);
        }
        const index = operations.value.findIndex((o) => o.id === record.id);
        if (index > -1) {
          operations.value.splice(index, 1);
        }
        message.success($t('page.lowcode.meta.deleteSuccess'));
      } catch (error) {
        console.error($t('page.lowcode.meta.deleteFail'), error);
        message.error($t('page.lowcode.meta.deleteFail'));
      }
    },
  });
};

// Batch delete
const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.lowcode.meta.selectToDeleteOperations'));
    return;
  }

  Modal.confirm({
    title: $t('page.lowcode.meta.confirmBatchDelete'),
    content: $t('page.lowcode.meta.confirmBatchDeleteContent', { count: selectedRowKeys.value.length }),
    onOk: async () => {
      try {
        const idsToDelete = selectedRowKeys.value.map((key) => Number(key));
        if (idsToDelete.length > 0) {
          await batchDeleteOperation(idsToDelete);
        }
        operations.value = operations.value.filter(
          (o) => !selectedRowKeys.value.includes(String(o.id))
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

// Submit edit form
const handleEditSubmit = async () => {
  if (!editForm.operationCode || !editForm.operationName) {
    message.warning($t('page.lowcode.meta.fillRequiredFields'));
    return;
  }

  try {
    if (isEditing.value) {
      // Update
      const index = operations.value.findIndex((o) => o.id === editForm.id);
      if (index > -1) {
        const updatedOperation = { ...operations.value[index], ...editForm };
        if (updatedOperation.id) {
          await updateOperation(updatedOperation);
        }
        operations.value[index] = updatedOperation;
      }
      message.success($t('page.common.updateSuccess'));
    } else {
      // Add new
      const existing = operations.value.find(
        (o) => o.operationCode === editForm.operationCode
      );
      if (existing) {
        message.warning($t('page.lowcode.meta.operationIdentifierExists'));
        return;
      }
      const newOperation = { ...editForm, tableCode: props.tableCode } as TableOperation;
      await addOperation(newOperation);
      operations.value.push(newOperation);
      message.success($t('page.common.addSuccess'));
    }
    editModalVisible.value = false;
  } catch (error) {
    console.error($t('page.lowcode.meta.saveFail'), error);
    message.error($t('page.lowcode.meta.saveFail'));
  }
};

// 编辑$t('page.common.cancel')
const handleEditCancel = () => {
  editModalVisible.value = false;
};

// 关闭
const handleClose = () => {
  visible.value = false;
};

// ========== 拖拽排序 ==========
let sortableInstance: any = null;

async function initSortable() {
  const tbody = document.querySelector('.drag-table .ant-table-tbody') as HTMLElement;
  if (!tbody) return;

  const { initializeSortable } = useSortable(tbody, {
    handle: '.drag-icon',
    animation: 150,
    delay: 0,
    onEnd: async (evt: any) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex || oldIndex === undefined || newIndex === undefined) return;

      // 本地调整顺序
      const movedItem = operations.value.splice(oldIndex, 1)[0];
      operations.value.splice(newIndex, 0, movedItem);

      // 重新计算 sortOrder
      const orders = operations.value.map((item, index) => ({
        id: item.id!,
        sortOrder: index + 1,
      }));

      // 批量更新排序
      try {
        await sortOperations(orders);
        message.success('排序已保存');
      } catch (error: any) {
        message.error(error?.message || '排序保存失败');
        loadOperations();
      }
    },
  });

  sortableInstance = await initializeSortable();
}

function destroySortable() {
  if (sortableInstance && sortableInstance.destroy) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

// 监听弹窗打开，加载数据
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      loadOperations();
      // 等待表格渲染完成后初始化拖拽
      setTimeout(() => {
        initSortable();
      }, 300);
    } else {
      destroySortable();
    }
  }
);
</script>

<style scoped lang="less">
.operation-config {
  .operation-config-container {
    .footer-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }
  }
}

.mb-4 {
  margin-bottom: 16px;
}

.drag-icon {
  cursor: move;
  color: #999;
  font-size: 16px;

  &:hover {
    color: #1677ff;
  }
}
</style>
