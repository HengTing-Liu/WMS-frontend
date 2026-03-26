<template>
  <WmsPageLayout
    title="WMS0060 货位管理"
    description="管理库区下的具体存放位置（货架/货位）"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="storageName"
        search-placeholder="搜索货位名称..."
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="storage_filter_fields"
        :default-field-keys="['storageCode', 'storageName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            导出
          </Button>
        </template>
      </WmsFilterBar>
    </template>

    <template #table>
      <WmsDataTable
        row-key="id"
        :loading="loading"
        :columns="columns"
        :data-source="tableData"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: 1400 }"
        @change="handleTableChange"
      >
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              title="确认删除选中的货位记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'storageType'">
            {{ formatStorageType(record.storageType) }}
          </template>
          <template v-else-if="column.key === 'capacity'">
            {{ record.capacity ?? '-' }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Popconfirm
                title="确认删除该货位记录吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
          <template v-else>
            {{ (record as any)[column.dataIndex as keyof StorageResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <StorageModal
    ref="storageModalRef"
    :storage-id="currentEditId"
    v-model:open="modalVisible"
    :warehouse-options="warehouseOptions"
    :location-options="locationOptions"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  Grid3x3,
  Power,
  Ban,
  Package,
} from 'lucide-vue-next';
import {
  Button,
  Popconfirm,
  Space,
  Switch,
  message,
} from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  deleteStorage,
  exportStorage,
  listLocationSimple,
  listStoragePage,
  listWarehouseSimple,
  toggleStorageStatus,
  type StorageQuery,
  type StorageResult,
} from '#/api/sys/storage';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import StorageModal from './components/storage-modal.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<StorageResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const storageModalRef = ref<InstanceType<typeof StorageModal>>();

// Dropdown options
const warehouseOptions = ref<Array<{ label: string; value: number }>>([]);
const locationOptions = ref<Array<{ label: string; value: number }>>([]);

const pageActions = computed(() => [
  {
    label: '新建货位',
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = [
  { key: 'storageCode', label: '货位编码', type: 'input' as const },
  { key: 'storageName', label: '货位名称', type: 'input' as const },
  { key: 'warehouseId', label: '所属仓库', type: 'select' as const, options: warehouseOptions },
  { key: 'locationId', label: '所属库区', type: 'select' as const, options: locationOptions },
  { key: 'storageType', label: '货位类型', type: 'select' as const, options: storageTypeOptions },
];

const queryForm = reactive<StorageQuery>({
  storageCode: '',
  storageName: '',
  warehouseId: undefined,
  locationId: undefined,
  storageType: undefined,
  isEnabled: undefined,
});

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const storageTypeOptions = [
  { label: '平面', value: 'PLANE' },
  { label: '立体', value: 'STEREO' },
  { label: '货架', value: 'RACK' },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const totalCapacity = computed(() => tableData.value.reduce((sum, item) => sum + (item.capacity ?? 0), 0));

const statsCards = computed(() => [
  { key: 'total', label: '货位总数', icon: Grid3x3, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: '已启用', icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: '已停用', icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'capacity', label: '总容量', icon: Package, tone: 'purple' as const, value: totalCapacity.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = computed<TableColumnsType<StorageResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '货位编码', dataIndex: 'storageCode', key: 'storageCode', width: 140 },
  { title: '货位名称', dataIndex: 'storageName', key: 'storageName', width: 160 },
  { title: '所属库区', dataIndex: 'locationName', key: 'locationName', width: 160 },
  { title: '所属仓库', dataIndex: 'warehouseName', key: 'warehouseName', width: 140 },
  { title: '货位类型', dataIndex: 'storageType', key: 'storageType', width: 120 },
  { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 100 },
  { title: '状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    storageCode: queryForm.storageCode?.trim() || undefined,
    storageName: queryForm.storageName?.trim() || undefined,
    warehouseId: queryForm.warehouseId ?? undefined,
    locationId: queryForm.locationId ?? undefined,
    storageType: queryForm.storageType || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listStoragePage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || '货位列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  currentEditId.value = undefined;
  modalVisible.value = true;
}

function handleEdit(record: StorageResult) {
  currentEditId.value = record.id;
  storageModalRef.value?.open(record.id);
}

async function handleDelete(record: StorageResult) {
  try {
    await deleteStorage(record.id!);
    message.success('删除成功');
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteStorage(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: StorageResult, checked: boolean) {
  try {
    await toggleStorageStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '启用成功' : '停用成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportStorage(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `货位管理_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('导出成功');
  } catch (error: any) {
    message.error(error?.message || '导出失败');
  } finally {
    exporting.value = false;
  }
}

function formatStorageType(value?: string) {
  return storageTypeOptions.find((item) => item.value === value)?.label || value || '-';
}

function handleModalSuccess() {
  loadData();
}

async function loadDropdownOptions() {
  try {
    const [wh, loc] = await Promise.all([listWarehouseSimple(), listLocationSimple()]);
    warehouseOptions.value = wh;
    locationOptions.value = loc;
  } catch (e) {
    warehouseOptions.value = [];
    locationOptions.value = [];
  }
}

onMounted(async () => {
  await loadDropdownOptions();
  loadData();
});
</script>
