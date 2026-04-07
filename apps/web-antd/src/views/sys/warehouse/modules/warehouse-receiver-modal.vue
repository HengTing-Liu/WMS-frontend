<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="receiver-modal-content">
      <div class="toolbar mb-4">
        <Button type="primary" @click="handleAdd">
          + {{ $t('page.warehouse.addReceiver') }}
        </Button>
      </div>

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

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const modalTitle = computed(() => {
  return `${props.warehouseCode} - ${props.warehouseName} ${$t('page.warehouse.receiverManagement')}`;
});

const tableData = ref<WarehouseReceiverResult[]>([]);
const loading = ref(false);
const drawerVisible = ref(false);
const editId = ref<number | undefined>(undefined);

const columns = [
  { title: $t('page.warehouse.consignee'), dataIndex: 'consignee', key: 'consignee', width: 100 },
  { title: $t('page.warehouse.phoneNumber'), dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: $t('page.warehouse.provinceCity'), key: 'address', width: 150 },
  { title: $t('page.warehouse.detailedAddress'), dataIndex: 'detailedAddress', key: 'detailedAddress', ellipsis: true },
  { title: $t('page.warehouse.isDefault'), key: 'isDefault', width: 120, align: 'center' as const },
  { title: $t('page.common.action'), key: 'action', width: 150, fixed: 'right' as const },
];

const fetchData = async () => {
  if (!props.warehouseCode) return;
  loading.value = true;
  try {
    const res = await getWarehouseReceiverList({ warehouseCode: props.warehouseCode });
    tableData.value = Array.isArray(res) ? res : (res?.list || []);
  } finally {
    loading.value = false;
  }
};

const maskPhoneNumber = (phone: string) => {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
};

const handleAdd = () => {
  editId.value = undefined;
  drawerVisible.value = true;
};

const handleEdit = (record: WarehouseReceiverResult) => {
  editId.value = record.id;
  drawerVisible.value = true;
};

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

const handleSetDefault = async (record: WarehouseReceiverResult) => {
  try {
    await setDefaultWarehouseReceiver(record.id);
    message.success($t('page.warehouse.setDefaultSuccess'));
    fetchData();
  } catch {
    message.error($t('page.common.updateFailed'));
  }
};

const handleDrawerSuccess = () => {
  fetchData();
};

const handleCancel = () => {
  visible.value = false;
};

watch(
  () => props.open,
  (val) => {
    if (val) fetchData();
  }
);
</script>

<style scoped>
.receiver-modal-content { padding: 16px 0; }
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
</style>
