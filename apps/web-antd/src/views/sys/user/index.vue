<template>
  <Page auto-content-height>
    <div class="sys-user-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">WMS0080 用户管理</h1>
          <p class="page-desc">管理系统用户基本信息、角色分配等</p>
        </div>
        <div class="header-right">
          <Button type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            新建用户
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
              placeholder="搜索用户账号..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-input-wrap" style="flex: 0.8; min-width: 200px;">
            <Input
              v-model:value="queryForm.nick_name"
              allow-clear
              placeholder="搜索用户姓名..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-input-wrap" style="flex: 0.8; min-width: 160px;">
            <Input
              v-model:value="queryForm.phonenumber"
              allow-clear
              placeholder="搜索手机号..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.status"
            allow-clear
            placeholder="全部状态"
            class="status-select"
            :options="statusFilterOptions"
            @change="handleSearch"
          />
          <Button type="primary" @click="handleSearch">
            <template #icon><Search /></template>
            查询
          </Button>
          <Button @click="handleReset">
            <template #icon><RotateCcw /></template>
            重置
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
              <p class="stat-label">用户总数</p>
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
              <Ban />
            </div>
            <div class="stat-info">
              <p class="stat-label">已停用</p>
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
              <p class="stat-label">已绑定手机</p>
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
              title="确认删除选中的用户记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
          <Button :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            导出
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
                {{ record.status === '0' ? '正常' : '停用' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="handleAssignRole(record)"
                >
                  分配角色
                </Button>
                <Popconfirm
                  title="确认删除该用户记录吗？"
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

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
];

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
  showTotal: (total) => `共 ${total} 条`,
});

const columns = computed<TableColumnsType<SysUserResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((paginationConfig.current || 1) - 1) * (paginationConfig.pageSize || 10) + index + 1}` },
  { title: '用户编号', dataIndex: 'user_id', key: 'user_id', width: 100 },
  { title: '用户名', dataIndex: 'user_name', key: 'user_name', width: 120 },
  { title: '用户姓名', dataIndex: 'nick_name', key: 'nick_name', width: 120 },
  { title: '手机', dataIndex: 'phonenumber', key: 'phonenumber', width: 130 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
  { title: '部门', dataIndex: 'dept_name', key: 'dept_name', width: 140 },
  { title: '角色', dataIndex: 'role_names', key: 'role_names', width: 160, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'create_time', key: 'create_time', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
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
    message.error(error?.message || '用户列表加载失败');
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
    message.success('删除成功');
    if (tableData.value.length === 1 && (paginationConfig.current || 1) > 1) {
      paginationConfig.current = (paginationConfig.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (key) => key !== record.user_id
    );
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
    const ids = selectedRowKeys.value.map((id) => Number(id));
    await batchDeleteUser(ids);
    message.success('删除成功');
    selectedRowKeys.value = [];
    paginationConfig.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUser(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `用户管理_${Date.now()}.xlsx`;
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
