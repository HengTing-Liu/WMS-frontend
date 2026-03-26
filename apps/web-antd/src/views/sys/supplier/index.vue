<template>
  <WmsPageLayout title="WMS0020 供应商管理" description="管理供应商基本信息、联系方式等">
    <template #actions>
      <Button type="primary" @click="handleAdd">
        <template #icon><Plus /></template>
        新建供应商
      </Button>
    </template>

    <template #stats>
      <WmsStatsCards :items="statsCards" />
    </template>

    <template #filters>
      <WmsFilterBar
        :query="queryForm as any"
        search-key="supplierName"
        search-placeholder="搜索供应商名称..."
        status-key="isEnabled"
        :status-options="statusFilterOptions"
        :fields="allFieldDefs"
        :storage-key="STORAGE_KEY"
        :default-field-keys="['supplierCode', 'supplierName']"
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
            title="确认删除选中的供应商记录吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleBatchDelete"
          >
            <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
          </Popconfirm>
        </Space>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isEnabled'">
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
              title="确认删除该供应商记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <Button type="link" danger size="small">删除</Button>
            </Popconfirm>
          </Space>
        </template>
        <template v-else>
          {{ (record as any)[column.dataIndex as keyof SupplierResult] ?? '-' }}
        </template>
      </template>
    </WmsDataTable>

    <SupplierModal
      ref="supplierModalRef"
      :supplier-id="currentEditId"
      v-model:open="modalVisible"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
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

const STORAGE_KEY = 'supplier_filter_fields';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<SupplierResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const currentEditId = ref<number>();
const supplierModalRef = ref<InstanceType<typeof SupplierModal>>();

interface FilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}

const allFieldDefs: FilterFieldDef[] = [
  { key: 'supplierCode', label: '供应商编码', type: 'input' },
  { key: 'supplierName', label: '供应商名称', type: 'input' },
  { key: 'contactPerson', label: '联系人', type: 'input' },
  { key: 'contactPhone', label: '联系电话', type: 'input' },
];

const queryForm = reactive<SupplierQuery>({
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  isEnabled: undefined,
});

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const hasContactCount = computed(() =>
  tableData.value.filter((item) => item.contactPhone || item.contactPerson).length
);

const statsCards = computed(() => [
  { key: 'total', label: '供应商总数', icon: Truck, tone: 'blue' as const, value: pagination.total || 0 },
  { key: 'enabled', label: '已启用', icon: Power, tone: 'green' as const, value: enabledCount.value },
  { key: 'disabled', label: '已停用', icon: Ban, tone: 'orange' as const, value: disabledCount.value },
  { key: 'contact', label: '有联系方式', icon: Phone, tone: 'purple' as const, value: hasContactCount.value },
]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = computed<TableColumnsType<SupplierResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '供应商编码', dataIndex: 'supplierCode', key: 'supplierCode', width: 140 },
  { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
  { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson', width: 120 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 140 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
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
    message.error(error?.message || '供应商列表加载失败');
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
    await Promise.all(selectedRowKeys.value.map((id) => deleteSupplier(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: SupplierResult, checked: boolean) {
  try {
    await toggleSupplierStatus(record.id!, checked ? 1 : 0);
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
    const blob = await exportSupplier(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `供应商管理_${Date.now()}.xlsx`;
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

function handleModalSuccess() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>
