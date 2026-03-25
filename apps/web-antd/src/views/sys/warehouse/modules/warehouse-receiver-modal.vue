<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="receiver-modal-content">
      <!-- 操作按钮 -->
      <div class="toolbar mb-4">
        <Button type="primary" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.warehouse.addReceiver') }}
        </Button>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'phoneNumber'">
            {{ maskPhoneNumber(record.phoneNumber) }}
          </template>
          <template v-if="column.key === 'address'">
            {{ record.province }}{{ record.city }}{{ record.district }}
          </template>
          <template v-if="column.key === 'isDefault'">
            <Tag v-if="record.isDefault === 1" color="success">
              {{ $t('page.warehouse.defaultAddress') }}
            </Tag>
            <Button
              v-else
              type="link"
              size="small"
              @click="handleSetDefault(record)"
            >
              {{ $t('page.warehouse.setDefault') }}
            </Button>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" @click="handleEdit(record)">
              {{ $t('page.common.edit') }}
            </Button>
            <Button type="link" danger @click="handleDelete(record)">
              {{ $t('page.common.delete') }}
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <!-- 新增/编辑抽屉 -->
    <WarehouseReceiverDrawer
      v-model:open="drawerVisible"
      :receiver-id="editId"
      :warehouse-code="warehouseCode"
      @success="handleDrawerSuccess"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { Button, Modal, Table, Tag, message } from 'ant-design-vue';

import {
  deleteWarehouseReceiver,
  getWarehouseReceiverList,
  setDefaultWarehouseReceiver,
  type WarehouseReceiverResult,
} from '#/api/sys/warehouse-receiver';

import WarehouseReceiverDrawer from './warehouse-receiver-drawer.vue';

const props = defineProps<{
  open: boolean;
  warehouseCode: string;
  warehouseName: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

// 弹窗显示状态
const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

// 弹窗标题
const modalTitle = computed(() => {
  return `${props.warehouseCode} - ${props.warehouseName} ${$t('page.warehouse.receiverManagement')}`;
});

// 表格数据
const tableData = ref<WarehouseReceiverResult[]>([]);
const loading = ref(false);

// 抽屉状态
const drawerVisible = ref(false);
const editId = ref<number | undefined>(undefined);

// 表格列定义
const columns = [
  {
    title: $t('page.warehouse.consignee'),
    dataIndex: 'consignee',
    key: 'consignee',
    width: 100,
  },
  {
    title: $t('page.warehouse.phoneNumber'),
    dataIndex: 'phoneNumber',
    key: 'phoneNumber',
    width: 130,
  },
  {
    title: $t('page.warehouse.provinceCity'),
    key: 'address',
    width: 150,
  },
  {
    title: $t('page.warehouse.detailedAddress'),
    dataIndex: 'detailedAddress',
    key: 'detailedAddress',
    ellipsis: true,
  },
  {
    title: $t('page.warehouse.isDefault'),
    key: 'isDefault',
    width: 120,
    align: 'center' as const,
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
];

// 获取数据
const fetchData = async () => {
  if (!props.warehouseCode) return;
  loading.value = true;
  try {
    const res = await getWarehouseReceiverList({
      warehouseCode: props.warehouseCode,
    });
    tableData.value = res.data?.list || [];
  } finally {
    loading.value = false;
  }
};

// 手机号脱敏
const maskPhoneNumber = (phone: string) => {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
};

// 新增
const handleAdd = () => {
  editId.value = undefined;
  drawerVisible.value = true;
};

// 编辑
const handleEdit = (record: WarehouseReceiverResult) => {
  editId.value = record.id;
  drawerVisible.value = true;
};

// 删除
const handleDelete = (record: WarehouseReceiverResult) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.warehouse.confirmDeleteReceiver', { name: record.consignee }),
    onOk: async () => {
      try {
        await deleteWarehouseReceiver(record.id);
        message.success($t('page.common.deleteSuccess'));
        fetchData();
      } catch {
        message.error($t('page.common.deleteFailed'));
      }
    },
  });
};

// 设为默认
const handleSetDefault = async (record: WarehouseReceiverResult) => {
  try {
    await setDefaultWarehouseReceiver(record.id);
    message.success($t('page.warehouse.setDefaultSuccess'));
    fetchData();
  } catch {
    message.error($t('page.common.updateFailed'));
  }
};

// 抽屉成功回调
const handleDrawerSuccess = () => {
  fetchData();
};

// 取消
const handleCancel = () => {
  visible.value = false;
};

// 监听弹窗打开，获取数据
watch(
  () => props.open,
  (val) => {
    if (val) {
      fetchData();
    }
  }
);
</script>

<style scoped>
.receiver-modal-content {
  padding: 16px 0;
}
.toolbar {
  display: flex;
  justify-content: flex-end;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
