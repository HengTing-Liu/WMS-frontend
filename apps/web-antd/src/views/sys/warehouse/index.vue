<template>
  <WmsPageLayout
    title="WMS0010 仓库档案"
    description="管理仓库基本信息、温区、质检分区等"
    :actions="pageActions"
  >
    <template #filter>
      <WmsFilterBar
        :query="queryForm"
        search-key="warehouseName"
        search-placeholder="搜索仓库名称..."
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
            导出
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
              title="确认删除选中的仓库记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
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
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                编辑
              </Button>
              <Popconfirm
                v-access:code="'base:warehouse:delete'"
                title="确认删除该仓库记录吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">删除</Button>
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

const filterFields = [
  { key: 'warehouseCode', label: '仓库编码', type: 'input' as const },
  { key: 'warehouseName', label: '仓库名称', type: 'input' as const },
  { key: 'company', label: '所属公司', type: 'input' as const },
  { key: 'temperatureZone', label: '温区', type: 'select' as const, options: temperatureZoneOptions },
  { key: 'qualityZone', label: '质量区', type: 'select' as const, options: qualityZoneOptions },
];

const router = useRouter();

const pageActions = computed(() => [
  {
    label: '新建仓库',
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
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const normalTempCount = computed(() => tableData.value.filter((item) => item.temperatureZone === 'NORMAL').length);

const statsCards = computed(() => [
  { key: 'total', label: '总仓库数', value: pagination.total || 0, icon: Warehouse, tone: 'blue' as const },
  { key: 'enabled', label: '已启用', value: enabledCount.value, icon: Power, tone: 'green' as const },
  { key: 'disabled', label: '已停用', value: disabledCount.value, icon: MapPin, tone: 'orange' as const },
  { key: 'normal', label: '常温仓库', value: normalTempCount.value, icon: Thermometer, tone: 'purple' as const },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const temperatureZoneOptions = [
  { label: '常温', value: 'NORMAL' },
  { label: '2-8℃', value: 'COLD' },
  { label: '-20℃', value: 'FREEZE' },
  { label: '-80℃', value: 'CONSTANT' },
  { label: '液氮', value: 'LIQUID_NITROGEN' },
];

const qualityZoneOptions = [
  { label: '合格区', value: 'QUALIFIED' },
  { label: '待检区', value: 'PENDING' },
  { label: '不合格区', value: 'UNQUALIFIED' },
  { label: '隔离区', value: 'ISOLATION' },
  { label: '退货区', value: 'RETURN' },
];


const columns = computed<TableColumnsType<WarehouseResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '仓库编码', dataIndex: 'warehouseCode', key: 'warehouseCode', width: 140 },
  { title: '仓库名称', dataIndex: 'warehouseName', key: 'warehouseName', width: 160 },
  { title: '所属公司', dataIndex: 'company', key: 'company', width: 160 },
  { title: '温区', dataIndex: 'temperatureZone', key: 'temperatureZone', width: 120 },
  { title: '质量区', dataIndex: 'qualityZone', key: 'qualityZone', width: 140 },
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
    message.error(error?.message || '仓库列表加载失败');
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
    await Promise.all(selectedRowKeys.value.map((id) => deleteWarehouse(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: WarehouseResult, checked: boolean) {
  try {
    await toggleWarehouseStatus(record.id!, checked ? 1 : 0);
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
    const blob = await exportWarehouse(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `仓库档案_${Date.now()}.xlsx`;
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
