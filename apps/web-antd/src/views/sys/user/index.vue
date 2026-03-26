<template>
  <Page auto-content-height>
    <div class="sys-user-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">{{ $t('page.wms.user.listTitle') }}</h1>
          <p class="page-desc">{{ $t('page.wms.user.listDescription') }}</p>
        </div>
        <div class="header-right">
          <Button type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            {{ $t('page.wms.user.add') }}
          </Button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="queryForm.user_name"
              allow-clear
              :placeholder="$t('page.wms.user.filter.userName')"
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-input-wrap" style="flex: 0.8; min-width: 200px;">
            <Input
              v-model:value="queryForm.nick_name"
              allow-clear
              :placeholder="$t('page.wms.user.filter.nickName')"
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-input-wrap" style="flex: 0.8; min-width: 160px;">
            <Input
              v-model:value="queryForm.phonenumber"
              allow-clear
              :placeholder="$t('page.wms.user.filter.phonenumber')"
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.status"
            allow-clear
            :placeholder="$t('page.wms.user.status.all')"
            class="status-select"
            :options="statusFilterOptions"
            @change="handleSearch"
          />
          <Button type="primary" @click="handleSearch">
            <template #icon><Search /></template>
            {{ $t('page.common.search') }}
          </Button>
          <Button @click="handleReset">
            <template #icon><RotateCcw /></template>
            {{ $t('page.common.reset') }}
          </Button>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <Users />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.user.stats.total') }}</p>
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
              <p class="stat-label">{{ $t('page.wms.user.stats.enabled') }}</p>
              <p class="stat-value">{{ enabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-disabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-orange">
              <Ban />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.user.stats.disabled') }}</p>
              <p class="stat-value">{{ disabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-mobile" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Smartphone />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('page.wms.user.stats.hasMobile') }}</p>
              <p class="stat-value">{{ hasMobileCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table -->
      <Card :bordered="false" class="table-card">
        <div class="toolbar">
          <Space wrap>
            <Popconfirm
              :title="$t('page.wms.user.batchDeleteConfirm')"
              :ok-text="$t('page.common.confirm')"
              :cancel-text="$t('page.common.cancel')"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">
                {{ $t('page.common.delete') }}
              </Button>
            </Popconfirm>
          </Space>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            {{ $t('page.wms.user.export') }}
          </Button>
        </div>

        <Table
          row-key="user_id"
          :loading="loading"
          :columns="columns"
          :data-source="tableData"
          :pagination="paginationConfig"
          :row-selection="rowSelection"
          :scroll="{ x: 1400 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user_id'">
              <span class="user-id-cell">{{ record.user_id }}</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="record.status === '0' ? 'green' : 'red'">
                {{ $t(record.status === '0' ? 'page.wms.user.status.normal' : 'page.wms.user.status.disabled') }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ $t('page.common.edit') }}
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="handleAssignRole(record)"
                >
                  {{ $t('page.wms.user.assignRole') }}
                </Button>
                <Popconfirm
                  :title="$t('page.wms.user.deleteConfirm')"
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
          </template>
        </Table>
      </Card>

      <!-- Edit Modal -->
      <UserModal
        ref="userModalRef"
        :user-id="currentEditId"
        v-model:open="modalVisible"
        @success="handleModalSuccess"
      />

      <!-- Assign Role Modal -->
      <AssignRoleModal
        ref="assignRoleModalRef"
        :user-id="currentAssignRoleUserId"
        v-model:open="assignRoleModalVisible"
        @success="handleModalSuccess"
      />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import {
  Plus,
  Search,
  Download,
  RotateCcw,
  Users,
  Power,
  Ban,
  Smartphone,
} from 'lucide-vue-next';
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  listUserPage,
  deleteUser,
  exportUser,
  toggleUserStatus,
  batchDeleteUser,
  type SysUserResult,
  type SysUserQuery,
} from '#/api/sys/user';

import UserModal from './modules/user-modal.vue';
import AssignRoleModal from './modules/assign-role-modal.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<SysUserResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const modalVisible = ref(false);
const assignRoleModalVisible = ref(false);
const currentEditId = ref<number>();
const currentAssignRoleUserId = ref<number>();
const userModalRef = ref<any>();
const assignRoleModalRef = ref<any>();

const queryForm = reactive<SysUserQuery & Record<string, any>>({
  user_name: '',
  nick_name: '',
  phonenumber: '',
  status: undefined,
  dept_id: undefined,
});

const statusFilterOptions = computed(() => [
  { label: $t('page.wms.user.status.all'), value: undefined },
  { label: $t('page.wms.user.status.normal'), value: '0' },
  { label: $t('page.wms.user.status.disabled'), value: '1' },
]);

const enabledCount = computed(() =>
  tableData.value.filter((item) => item.status === '0').length
);
const disabledCount = computed(() =>
  tableData.value.filter((item) => item.status === '1').length
);
const hasMobileCount = computed(() =>
  tableData.value.filter((item) => item.phonenumber).length
);

const paginationConfig = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => $t('page.common.total', { total }),
});

const columns = computed<TableColumnsType<SysUserResult>>(() => [
  { title: $t('page.common.seq'), key: 'index', width: 70, customRender: ({ index }) => `${((paginationConfig.current || 1) - 1) * (paginationConfig.pageSize || 10) + index + 1}` },
  { title: $t('page.wms.user.columns.userId'), dataIndex: 'user_id', key: 'user_id', width: 100 },
  { title: $t('page.wms.user.columns.userName'), dataIndex: 'user_name', key: 'user_name', width: 120 },
  { title: $t('page.wms.user.columns.nickName'), dataIndex: 'nick_name', key: 'nick_name', width: 120 },
  { title: $t('page.wms.user.columns.phonenumber'), dataIndex: 'phonenumber', key: 'phonenumber', width: 130 },
  { title: $t('page.wms.user.columns.email'), dataIndex: 'email', key: 'email', width: 180 },
  { title: $t('page.wms.user.columns.deptName'), dataIndex: 'dept_name', key: 'dept_name', width: 140 },
  { title: $t('page.wms.user.columns.roleNames'), dataIndex: 'role_names', key: 'role_names', width: 160, ellipsis: true },
  { title: $t('page.common.status'), dataIndex: 'status', key: 'status', width: 90 },
  { title: $t('page.wms.user.columns.createTime'), dataIndex: 'create_time', key: 'create_time', width: 180 },
  { title: $t('page.common.operation'), key: 'action', fixed: 'right', width: 180 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function normalizeQuery() {
  return {
    user_name: queryForm.user_name?.trim() || undefined,
    nick_name: queryForm.nick_name?.trim() || undefined,
    phonenumber: queryForm.phonenumber?.trim() || undefined,
    status: queryForm.status ?? undefined,
    dept_id: queryForm.dept_id ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listUserPage({
      pageNum: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    paginationConfig.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    paginationConfig.total = 0;
    message.error($t('page.wms.user.messages.loadFail'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  paginationConfig.current = 1;
  loadData();
}

function handleReset() {
  queryForm.user_name = '';
  queryForm.nick_name = '';
  queryForm.phonenumber = '';
  queryForm.status = undefined;
  queryForm.dept_id = undefined;
  selectedRowKeys.value = [];
  paginationConfig.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  paginationConfig.current = page.current || 1;
  paginationConfig.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  currentEditId.value = undefined;
  modalVisible.value = true;
}

function handleEdit(record: SysUserResult) {
  currentEditId.value = record.user_id!;
  userModalRef.value?.open(record.user_id);
}

function handleAssignRole(record: SysUserResult) {
  currentAssignRoleUserId.value = record.user_id!;
  assignRoleModalVisible.value = true;
}

async function handleDelete(record: SysUserResult) {
  try {
    await deleteUser(record.user_id!);
    message.success($t('page.wms.user.messages.deleteSuccess'));
    if (tableData.value.length === 1 && (paginationConfig.current || 1) > 1) {
      paginationConfig.current = (paginationConfig.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (key) => key !== record.user_id
    );
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.user.messages.deleteFail'));
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.user.messages.selectToDelete'));
    return;
  }
  try {
    const ids = selectedRowKeys.value.map((id) => Number(id));
    await batchDeleteUser(ids);
    message.success($t('page.wms.user.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    paginationConfig.current = 1;
    await loadData();
  } catch (error: any) {
    message.error($t('page.wms.user.messages.batchDeleteFail'));
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUser(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${$t('page.wms.user.listTitle')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.wms.user.messages.exportSuccess'));
  } catch (error: any) {
    message.error($t('page.wms.user.messages.exportFail'));
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

<style scoped>
.sys-user-page {
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
  min-width: 180px;
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

.user-id-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
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
