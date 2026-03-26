<template>
  <WmsPageLayout
    :title="$t('page.wms.supplier.listTitle')"
    :description="$t('page.wms.supplier.listDescription')"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="supplierName"
        :search-placeholder="$t('page.wms.supplier.searchPlaceholder')"
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="wms:filter:supplier:activeFields"
        :default-field-keys="['supplierCode', 'supplierName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.supplier.export') }}
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
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
      >
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              :title="$t('page.wms.supplier.batchDeleteConfirm')"
              :ok-text="$t('page.common.confirm')"
              :cancel-text="$t('page.common.cancel')"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">
                {{ $t('page.common.delete') }}
              </Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              :checked-children="$t('page.common.enabled')"
              :un-checked-children="$t('page.common.disabled')"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                {{ $t('page.common.edit') }}
              </Button>
              <Popconfirm
                :title="$t('page.wms.supplier.deleteConfirm')"
                :ok-text="$t('page.common.confirm')"
                :cancel-text="$t('page.common.cancel')"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">
                  {{ $t('page.common.delete') }}
                </Button>
              </Popconfirm>
            </Space>
          </template>
          <template v-else>
            {{ (record as any)[column.dataIndex as keyof SupplierResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <SupplierModal
    ref="supplierModalRef"
    :supplier-id="currentEditId"
    v-model:open="modalVisible"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  Truck,
  Power,
  Ban,
  Phone,
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
  deleteSupplier,
  exportSupplier,
  listSupplierPage,
  toggleSupplierStatus,
  type SupplierQuery,
  type SupplierResult,
} from '#/api/sys/supplier';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import SupplierModal from './components/supplier-modal.vue';
import { $t } from '@vben/locales';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<SupplierResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const supplierModalRef = ref<InstanceType<typeof SupplierModal>>();

const pageActions = computed(() => [
  {
    label: $t('page.wms.supplier.add'),
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = computed(() => [
  { key: 'supplierCode', label: $t('page.wms.supplier.filter.supplierCode'), type: 'input' as const },
  { key: 'supplierName', label: $t('page.wms.supplier.filter.supplierName'), type: 'input' as const },
  { key: 'contactPerson', label: $t('page.wms.supplier.filter.contactPerson'), type: 'input' as const },
  { key: 'contactPhone', label: $t('page.wms.supplier.filter.contactPhone'), type: 'input' as const },
]);

const queryForm = reactive<SupplierQuery>({
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  isEnabled: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.supplier.status.all'), value: undefined },
  { label: $t('page.wms.supplier.status.enabled'), value: 1 },
  { label: $t('page.wms.supplier.status.disabled'), value: 0 },
]);

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const hasContactCount = computed(() =>
  tableData.value.filter((item) => item.contactPhone || item.contactPerson).length
);

const statsCards = computed(() => [
  { key: 'total', label: $t('page.wms.supplier.stats.total'), icon: Truck, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: $t('page.wms.supplier.stats.enabled'), icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: $t('page.wms.supplier.stats.disabled'), icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'contact', label: $t('page.wms.supplier.stats.hasContact'), icon: Phone, tone: 'purple' as const, value: hasContactCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

const columns = computed<TableColumnsType<SupplierResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.supplier.columns.supplierCode'), dataIndex: 'supplierCode', key: 'supplierCode', width: 140 },
  { title: $t('page.wms.supplier.columns.supplierName'), dataIndex: 'supplierName', key: 'supplierName', width: 180 },
  { title: $t('page.wms.supplier.columns.contactPerson'), dataIndex: 'contactPerson', key: 'contactPerson', width: 120 },
  { title: $t('page.wms.supplier.columns.contactPhone'), dataIndex: 'contactPhone', key: 'contactPhone', width: 140 },
  { title: $t('page.wms.supplier.columns.email'), dataIndex: 'email', key: 'email', width: 180 },
  { title: $t('page.common.status'), dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: $t('page.wms.supplier.columns.createTime'), dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: $t('page.common.operation'), key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    supplierCode: queryForm.supplierCode?.trim() || undefined,
    supplierName: queryForm.supplierName?.trim() || undefined,
    contactPerson: queryForm.contactPerson?.trim() || undefined,
    contactPhone: queryForm.contactPhone?.trim() || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listSupplierPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error($t('page.wms.supplier.messages.loadFail'));
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

function handleEdit(record: SupplierResult) {
  currentEditId.value = record.id;
  supplierModalRef.value?.open(record.id);
}

async function handleDelete(record: SupplierResult) {
  try {
    await deleteSupplier(record.id!);
    message.success($t('page.wms.supplier.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.supplier.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.supplier.messages.selectToDelete'));
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteSupplier(Number(id))));
    message.success($t('page.wms.supplier.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.supplier.messages.batchDeleteFail'));
  }
}

async function handleToggleStatus(record: SupplierResult, checked: boolean) {
  try {
    await toggleSupplierStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.supplier.messages.enableSuccess') : $t('page.wms.supplier.messages.disableSuccess'));
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.supplier.messages.statusToggleFail'));
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportSupplier(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${$t('page.supplier.title')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.supplier.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.supplier.messages.exportFail'));
  } finally {
    exporting.value = false;
  }
}

function handleModalSuccess() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>
