<template>
  <WmsPageLayout
    :title="$t('page.wms.customer.listTitle')"
    :description="$t('page.wms.customer.listDescription')"
    :actions="pageActions"
  >
    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="customerName"
        :search-placeholder="$t('page.wms.customer.searchPlaceholder')"
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="filterFields"
        storage-key="wms:filter:customer:activeFields"
        :default-field-keys="['customerCode', 'customerName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.customer.export') }}
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
              :title="$t('page.wms.customer.batchDeleteConfirm')"
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
                :title="$t('page.wms.customer.deleteConfirm')"
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
            {{ (record as any)[column.dataIndex as keyof CustomerResult] ?? '-' }}
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>

  <CustomerModal
    ref="customerModalRef"
    :customer-id="currentEditId"
    v-model:open="modalVisible"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Plus,
  Download,
  Users,
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
  deleteCustomer,
  exportCustomer,
  listCustomerPage,
  toggleCustomerStatus,
  type CustomerQuery,
  type CustomerResult,
} from '#/api/wms/customer';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';

import CustomerModal from '../../sys/customer/components/customer-modal.vue';
import { $t } from '@vben/locales';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<CustomerResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const customerModalRef = ref<InstanceType<typeof CustomerModal>>();

const pageActions = computed(() => [
  {
    label: $t('page.wms.customer.add'),
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const filterFields = computed(() => [
  { key: 'customerCode', label: $t('page.wms.customer.filter.customerCode'), type: 'input' as const },
  { key: 'customerName', label: $t('page.wms.customer.filter.customerName'), type: 'input' as const },
  { key: 'contactPerson', label: $t('page.wms.customer.filter.contactPerson'), type: 'input' as const },
  { key: 'contactPhone', label: $t('page.wms.customer.filter.contactPhone'), type: 'input' as const },
  { key: 'mobile', label: $t('page.wms.customer.filter.mobile'), type: 'input' as const },
]);

const queryForm = reactive<CustomerQuery>({
  customerCode: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  mobile: '',
  isEnabled: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.customer.status.all'), value: undefined },
  { label: $t('page.wms.customer.status.enabled'), value: 1 },
  { label: $t('page.wms.customer.status.disabled'), value: 0 },
]);

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const hasContactCount = computed(() =>
  tableData.value.filter((item) => item.contactPhone || item.mobile || item.contactPerson).length
);

const statsCards = computed(() => [
  { key: 'total', label: $t('page.wms.customer.stats.total'), icon: Users, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: $t('page.wms.customer.stats.enabled'), icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: $t('page.wms.customer.stats.disabled'), icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'contact', label: $t('page.wms.customer.stats.hasContact'), icon: Phone, tone: 'purple' as const, value: hasContactCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.totalRecords', { total }),
});

const columns = computed<TableColumnsType<CustomerResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.customer.columns.customerCode'), dataIndex: 'customerCode', key: 'customerCode', width: 140 },
  { title: $t('page.wms.customer.columns.customerName'), dataIndex: 'customerName', key: 'customerName', width: 180 },
  { title: $t('page.wms.customer.columns.contactPerson'), dataIndex: 'contactPerson', key: 'contactPerson', width: 120 },
  { title: $t('page.wms.customer.columns.mobile'), dataIndex: 'mobile', key: 'mobile', width: 140 },
  { title: $t('page.wms.customer.columns.contactPhone'), dataIndex: 'contactPhone', key: 'contactPhone', width: 140 },
  { title: $t('page.common.status'), dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: $t('page.wms.customer.columns.createTime'), dataIndex: 'createTime', key: 'createTime', width: 180 },
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
    customerCode: queryForm.customerCode?.trim() || undefined,
    customerName: queryForm.customerName?.trim() || undefined,
    contactPerson: queryForm.contactPerson?.trim() || undefined,
    contactPhone: queryForm.contactPhone?.trim() || undefined,
    mobile: queryForm.mobile?.trim() || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listCustomerPage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error($t('page.wms.customer.messages.loadFail'));
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

function handleEdit(record: CustomerResult) {
  currentEditId.value = record.id;
  customerModalRef.value?.open(record.id);
}

async function handleDelete(record: CustomerResult) {
  try {
    await deleteCustomer(record.id!);
    message.success($t('page.wms.customer.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.customer.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.customer.messages.selectToDelete'));
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteCustomer(Number(id))));
    message.success($t('page.wms.customer.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.customer.messages.batchDeleteFail'));
  }
}

async function handleToggleStatus(record: CustomerResult, checked: boolean) {
  try {
    await toggleCustomerStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.customer.messages.enableSuccess') : $t('page.wms.customer.messages.disableSuccess'));
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.customer.messages.statusToggleFail'));
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportCustomer(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${$t('page.customer.title')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.customer.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.customer.messages.exportFail'));
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
