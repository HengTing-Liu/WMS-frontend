<template>
  <Page auto-content-height>
    <div class="wms-warehouse-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">WMS0010 仓库档案</h1>
          <p class="page-desc">管理仓库基本信息、温区、质检分区等</p>
        </div>
        <div class="header-right">
          <Button v-access:code="'base:warehouse:add'" type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            新建仓库
          </Button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="queryForm.warehouseName"
              allow-clear
              placeholder="搜索仓库编号或名称..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.warehouseCode"
            allow-clear
            placeholder="全部状态"
            class="status-select"
            :options="statusFilterOptions"
            @change="handleSearch"
          />
          <Button @click="showMoreFilter = !showMoreFilter">
            <template #icon><Filter /></template>
            更多筛选
          </Button>
          <Button v-access:code="'base:warehouse:export'" :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            导出
          </Button>
        </div>
        <!-- More Filters (expandable) -->
        <div v-if="showMoreFilter" class="more-filters">
          <Form layout="inline" :model="queryForm">
            <FormItem label="仓库编码">
              <Input v-model:value="queryForm.warehouseCode" allow-clear placeholder="请输入仓库编码" />
            </FormItem>
            <FormItem label="所属公司">
              <Input v-model:value="queryForm.company" allow-clear placeholder="请输入所属公司" />
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="handleSearch">查询</Button>
                <Button @click="handleReset">重置</Button>
              </Space>
            </FormItem>
          </Form>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <Warehouse />
            </div>
            <div class="stat-info">
              <p class="stat-label">总仓库数</p>
              <p class="stat-value">{{ pagination.total }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-enabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-green">
              <Power />
            </div>
            <div class="stat-info">
              <p class="stat-label">已启用</p>
              <p class="stat-value">{{ enabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-disabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-orange">
              <MapPin />
            </div>
            <div class="stat-info">
              <p class="stat-label">已停用</p>
              <p class="stat-value">{{ disabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-normal" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Thermometer />
            </div>
            <div class="stat-info">
              <p class="stat-label">常温仓库</p>
              <p class="stat-value">{{ normalTempCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table -->
      <Card :bordered="false" class="table-card">
        <div class="toolbar">
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
        </div>

        <Table
          row-key="id"
          :loading="loading"
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :row-selection="rowSelection"
          :scroll="{ x: 1200 }"
          @change="handleTableChange"
        >
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
                <Button
                  v-access:code="'base:warehouse:edit'"
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
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
        </Table>
      </Card>

      <Modal
        v-model:open="formVisible"
        :title="formMode === 'add' ? '新增仓库' : '编辑仓库'"
        :confirm-loading="submitting"
        :mask-closable="false"
        width="720px"
        @ok="handleSubmit"
        @cancel="handleCancel"
      >
        <Form ref="formRef" :model="formData" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="仓库编码" name="warehouseCode">
                <Input v-model:value="formData.warehouseCode" maxlength="50" placeholder="请输入仓库编码" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="仓库名称" name="warehouseName">
                <Input v-model:value="formData.warehouseName" maxlength="100" placeholder="请输入仓库名称" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="所属公司" name="company">
                <Input v-model:value="formData.company" maxlength="100" placeholder="请输入所属公司" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="温区" name="temperatureZone">
                <Select v-model:value="formData.temperatureZone" :options="temperatureOptions" placeholder="请选择温区" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="质量区" name="qualityZone">
                <Select v-model:value="formData.qualityZone" :options="qualityOptions" placeholder="请选择质量区" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="状态" name="isEnabled">
                <Select v-model:value="formData.isEnabled" :options="statusOptions" placeholder="请选择状态" />
              </FormItem>
            </Col>
            <Col :span="24">
              <FormItem label="备注" name="remark" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                <Input.TextArea v-model:value="formData.remark" :rows="4" maxlength="500" show-count placeholder="请输入备注" />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Plus,
  Search,
  Filter,
  Download,
  Warehouse,
  Power,
  MapPin,
  Thermometer,
} from 'lucide-vue-next';
import {
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  message,
} from 'ant-design-vue';
import type { FormInstance, TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  deleteWarehouse,
  exportWarehouse,
  getWarehouseDetail,
  listWarehousePage,
  toggleWarehouseStatus,
  updateWarehouse,
  createWarehouse,
  type WarehouseQuery,
  type WarehouseResult,
} from '#/api/sys/warehouse';

interface WarehouseForm extends Partial<WarehouseResult> {
  id?: number;
}

const loading = ref(false);
const submitting = ref(false);
const exporting = ref(false);
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const tableData = ref<WarehouseResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const formRef = ref<FormInstance>();
const showMoreFilter = ref(false);

const queryForm = reactive<WarehouseQuery>({
  warehouseCode: '',
  warehouseName: '',
  company: '',
});

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

// Stats computed
const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const normalTempCount = computed(() => tableData.value.filter((item) => item.temperatureZone === 'NORMAL').length);

const formData = reactive<WarehouseForm>(createDefaultForm());

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const temperatureOptions = [
  { label: '常温', value: 'NORMAL' },
  { label: '冷藏', value: 'COLD' },
  { label: '冷冻', value: 'FREEZE' },
  { label: '恒温', value: 'CONSTANT' },
];

const qualityOptions = [
  { label: '合格品区', value: 'QUALIFIED' },
  { label: '不合格品区', value: 'UNQUALIFIED' },
  { label: '待验区', value: 'PENDING' },
  { label: '退货区', value: 'RETURN' },
];

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const formRules = {
  warehouseCode: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }],
  warehouseName: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  isEnabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

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

function createDefaultForm(): WarehouseForm {
  return {
    warehouseCode: '',
    warehouseName: '',
    company: '',
    temperatureZone: undefined,
    qualityZone: undefined,
    isEnabled: 1,
    remark: '',
  };
}

function resetFormData() {
  Object.assign(formData, createDefaultForm());
}

function normalizeQuery() {
  return {
    warehouseCode: queryForm.warehouseCode?.trim() || undefined,
    warehouseName: queryForm.warehouseName?.trim() || undefined,
    company: queryForm.company?.trim() || undefined,
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
  formMode.value = 'add';
  resetFormData();
  formVisible.value = true;
}

async function handleEdit(record: WarehouseResult) {
  formMode.value = 'edit';
  resetFormData();
  try {
    const detail = await getWarehouseDetail(record.id!);
    Object.assign(formData, detail || {}, { id: record.id });
  } catch {
    Object.assign(formData, record || {});
  }
  formVisible.value = true;
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

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    if (formMode.value === 'edit') {
      await updateWarehouse(formData as WarehouseResult);
    } else {
      await createWarehouse(formData);
    }
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    await loadData();
  } catch (error: any) {
    if (error?.errorFields) {
      return;
    }
    message.error(error?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  formVisible.value = false;
  formRef.value?.clearValidate();
}

function formatTemperatureZone(value?: string) {
  return temperatureOptions.find((item) => item.value === value)?.label || value || '-';
}

function formatQualityZone(value?: string) {
  return qualityOptions.find((item) => item.value === value)?.label || value || '-';
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.wms-warehouse-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right :deep(.ant-btn-primary) {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Filter Card */
.filter-card :deep(.ant-card-body) {
  padding: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  z-index: 1;
}

.search-input {
  padding-left: 36px !important;
}

.status-select {
  width: 140px;
}

.more-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card :deep(.ant-card-body) {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap :deep(svg) {
  width: 20px;
  height: 20px;
}

.stat-icon-blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.stat-icon-green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.stat-icon-orange {
  background-color: #fff7ed;
  color: #ea580c;
}

.stat-icon-purple {
  background-color: #faf5ff;
  color: #9333ea;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

/* Table Card */
.table-card :deep(.ant-card-body) {
  padding: 0 16px 16px 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search-card :deep(.ant-card-body),
.wms-warehouse-page :deep(.ant-card-body) {
  padding: 16px;
}

.search-form {
  row-gap: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
