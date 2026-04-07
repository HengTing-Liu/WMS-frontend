<template>
  <WmsPageLayout
    title="WMS0010 浠撳簱妗ｆ"
    description="绠＄悊浠撳簱鍩烘湰淇℃伅銆佹俯鍖恒€佽川妫€鍒嗗尯绛?
    :actions="pageActions"
  >
    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="warehouseName"
        search-placeholder="鎼滅储浠撳簱鍚嶇О..."
        status-key="isEnabled"
        :status-options="statusOptions"
        :fields="filterFields"
        storage-key="wms:filter:warehouse:activeFields"
        :default-field-keys="['warehouseCode', 'warehouseName']"
        @search="handleSearch"
      >
        <template #actions>
          <Button v-access:code="'base:warehouse:export'" :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            瀵煎嚭
          </Button>
        </template>
      </WmsFilterBar>
    </template>

    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #table>
      <WmsDataTable
        :loading="loading"
        :columns="columns"
        :data-source="tableData"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: 1200 }"
        @table-change="handleTableChange"
      >
        <template #toolbar>
          <Space wrap>
            <Popconfirm
              v-access:code="'base:warehouse:delete'"
              title="纭鍒犻櫎閫変腑鐨勪粨搴撹褰曞悧锛?
              ok-text="纭畾"
              cancel-text="鍙栨秷"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">鍒犻櫎</Button>
            </Popconfirm>
          </Space>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'temperatureZone'">
            {{ formatTemperatureZone(record.temperatureZone) }}
          </template>
          <template v-else-if="column.key === 'qualityZone'">
            {{ formatQualityZone(record.qualityZone) }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              checked-children="鍚敤"
              un-checked-children="鍋滅敤"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                缂栬緫
              </Button>
              <Popconfirm
                v-access:code="'base:warehouse:delete'"
                title="纭鍒犻櫎璇ヤ粨搴撹褰曞悧锛?
                ok-text="纭畾"
                cancel-text="鍙栨秷"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">鍒犻櫎</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </WmsDataTable>
    </template>
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Download,
  Plus,
  Warehouse,
  Power,
  MapPin,
  Thermometer,
} from 'lucide-vue-next';
import {
  Button,
  Popconfirm,
  Space,
  Switch,
  message,
} from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { WmsDataTable, WmsFilterBar, WmsPageLayout, WmsStatsCards } from '#/components/wms';
import {
  deleteWarehouse,
  exportWarehouse,
  listWarehousePage,
  toggleWarehouseStatus,
  type WarehouseQuery,
  type WarehouseResult,
} from '#/api/sys/warehouse';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<WarehouseResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);

const temperatureZoneOptions = [
  { label: '甯告俯', value: 'NORMAL' },
  { label: '2-8鈩?, value: 'COLD' },
  { label: '-20鈩?, value: 'FREEZE' },
  { label: '-80鈩?, value: 'CONSTANT' },
  { label: '娑叉爱', value: 'LIQUID_NITROGEN' },
];

const qualityZoneOptions = [
  { label: '鍚堟牸鍖?, value: 'QUALIFIED' },
  { label: '寰呮鍖?, value: 'PENDING' },
  { label: '涓嶅悎鏍煎尯', value: 'UNQUALIFIED' },
  { label: '闅旂鍖?, value: 'ISOLATION' },
  { label: '閫€璐у尯', value: 'RETURN' },
];

const filterFields = [
  { key: 'warehouseCode', label: '浠撳簱缂栫爜', type: 'input' as const },
  { key: 'warehouseName', label: '浠撳簱鍚嶇О', type: 'input' as const },
  { key: 'company', label: '鎵€灞炲叕鍙?, type: 'input' as const },
  { key: 'temperatureZone', label: '娓╁尯', type: 'select' as const, options: temperatureZoneOptions },
  { key: 'qualityZone', label: '璐ㄩ噺鍖?, type: 'select' as const, options: qualityZoneOptions },
];

const router = useRouter();

const pageActions = computed(() => [
  {
    label: '鏂板缓浠撳簱',
    type: 'primary' as const,
    icon: Plus,
    onClick: handleAdd,
  },
]);

const queryForm = reactive<WarehouseQuery>({
  warehouseCode: '',
  warehouseName: '',
  company: '',
  temperatureZone: undefined,
  qualityZone: undefined,
  isEnabled: undefined,
});

const statusOptions = [
  { label: '鍚敤', value: 1 },
  { label: '鍋滅敤', value: 0 },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const normalTempCount = computed(() => tableData.value.filter((item) => item.temperatureZone === 'NORMAL').length);

const statsCards = computed(() => [
  { key: 'total', label: '鎬讳粨搴撴暟', value: pagination.total || 0, icon: Warehouse, tone: 'blue' as const },
  { key: 'enabled', label: '宸插惎鐢?, value: enabledCount.value, icon: Power, tone: 'green' as const },
  { key: 'disabled', label: '宸插仠鐢?, value: disabledCount.value, icon: MapPin, tone: 'orange' as const },
  { key: 'normal', label: '甯告俯浠撳簱', value: normalTempCount.value, icon: Thermometer, tone: 'purple' as const },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `鍏?${total} 鏉,
});


const columns = computed<TableColumnsType<WarehouseResult>>(() => [
  { title: '搴忓彿', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '浠撳簱缂栫爜', dataIndex: 'warehouseCode', key: 'warehouseCode', width: 140 },
  { title: '浠撳簱鍚嶇О', dataIndex: 'warehouseName', key: 'warehouseName', width: 160 },
  { title: '鎵€灞炲叕鍙?, dataIndex: 'company', key: 'company', width: 160 },
  { title: '娓╁尯', dataIndex: 'temperatureZone', key: 'temperatureZone', width: 120 },
  { title: '璐ㄩ噺鍖?, dataIndex: 'qualityZone', key: 'qualityZone', width: 140 },
  { title: '鐘舵€?, dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '鍒涘缓鏃堕棿', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '鎿嶄綔', key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    warehouseCode: queryForm.warehouseCode?.trim() || undefined,
    warehouseName: queryForm.warehouseName?.trim() || undefined,
    company: queryForm.company?.trim() || undefined,
    temperatureZone: queryForm.temperatureZone || undefined,
    qualityZone: queryForm.qualityZone || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listWarehousePage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || '浠撳簱鍒楄〃鍔犺浇澶辫触');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleReset() {
  queryForm.warehouseCode = '';
  queryForm.warehouseName = '';
  queryForm.company = '';
  queryForm.temperatureZone = undefined;
  queryForm.qualityZone = undefined;
  queryForm.isEnabled = undefined;
  selectedRowKeys.value = [];
  pagination.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  router.push('/sys/warehouse/edit');
}

function handleEdit(record: WarehouseResult) {
  router.push({ path: '/sys/warehouse/edit', query: { id: String(record.id) } });
}

async function handleDelete(record: WarehouseResult) {
  try {
    await deleteWarehouse(record.id!);
    message.success('鍒犻櫎鎴愬姛');
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '鍒犻櫎澶辫触');
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('璇峰厛閫夋嫨瑕佸垹闄ょ殑璁板綍');
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteWarehouse(Number(id))));
    message.success('鍒犻櫎鎴愬姛');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '鎵归噺鍒犻櫎澶辫触');
  }
}

async function handleToggleStatus(record: WarehouseResult, checked: boolean) {
  try {
    await toggleWarehouseStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '鍚敤鎴愬姛' : '鍋滅敤鎴愬姛');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '鐘舵€佸垏鎹㈠け璐?);
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportWarehouse(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `浠撳簱妗ｆ_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('瀵煎嚭鎴愬姛');
  } catch (error: any) {
    message.error(error?.message || '瀵煎嚭澶辫触');
  } finally {
    exporting.value = false;
  }
}

function formatTemperatureZone(value?: string) {
  return temperatureZoneOptions.find((item) => item.value === value)?.label || value || '-';
}

function formatQualityZone(value?: string) {
  return qualityZoneOptions.find((item) => item.value === value)?.label || value || '-';
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
</style>
