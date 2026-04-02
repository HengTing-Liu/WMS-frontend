<template>
  <div class="p-5 bg-white assign-user-page">
    <BasicGridPage
      ref="gridRef"
      :form-options="formOptions"
      :grid-options="gridOptions"
      :grid-events="gridEvents"
    >
      <!-- 工具栏 -->
      <template #toolbar-tools>
        <Button type="primary" class="btn-add-user" @click="openSelectUserModal">
          <IconifyIcon icon="material-symbols:add" class="mr-1" />
          添加用户
        </Button>
        <Popconfirm
          v-if="selectedRowKeys.length"
          title="确认要批量取消所选用户的该角色授权吗？"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchCancel"
        >
          <Button danger class="btn-batch-cancel">
            <IconifyIcon icon="ant-design:warning-outlined" class="mr-1" />
            批量取消授权
          </Button>
        </Popconfirm>
        <Button v-else danger class="btn-batch-cancel" disabled>
          <IconifyIcon icon="ant-design:warning-outlined" class="mr-1" />
          批量取消授权
        </Button>
        <Button class="btn-close" @click="handleClose">
          <IconifyIcon icon="ant-design:close-outlined" class="mr-1" />
          关闭
        </Button>
      </template>

      <!-- 状态列 -->
      <template #status="{ row }">
        <Tag :color="row.status === '0' ? 'processing' : 'default'">
          {{ row.status === '0' ? '正常' : '停用' }}
        </Tag>
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <Popconfirm
          :title="`确认要取消该用户「${row.userName}」角色吗？`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleCancelOne(row as AuthUserItem)"
        >
          <Button type="link" class="p-0 link-cancel">
            <IconifyIcon icon="ant-design:info-circle-outlined" class="link-cancel-icon mr-1" />
            取消授权
          </Button>
        </Popconfirm>
      </template>
    </BasicGridPage>

    <!-- 选择用户弹框 -->
    <Modal
      v-model:open="selectUserVisible"
      title="选择用户"
      width="920px"
      :footer="null"
      destroy-on-close
      class="select-user-modal-wrap"
      @cancel="closeSelectUserModal"
    >
      <div class="select-user-modal">
        <div class="mb-4 flex flex-wrap items-end gap-4">
          <div class="flex items-center gap-2">
            <span class="text-gray-700">用户名称</span>
            <Input v-model:value="unallocSearch.userName" placeholder="请输入用户名称" allow-clear class="w-[180px]" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-700">手机号码</span>
            <Input v-model:value="unallocSearch.phonenumber" placeholder="请输入手机号码" allow-clear class="w-[180px]" />
          </div>
          <Button type="primary" @click="loadUnallocatedList">搜索</Button>
          <Button @click="resetUnallocSearch">重置</Button>
        </div>
        <Table
          :columns="unallocColumns"
          :data-source="unallocList"
          :loading="unallocLoading"
          row-key="userId"
          :pagination="unallocPagination"
          :scroll="{ x: 860 }"
          :row-selection="{ selectedRowKeys: selectedUnallocKeys, onChange: (keys: (string|number)[]) => { selectedUnallocKeys = keys; } }"
          class="select-user-table"
          @change="onUnallocTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <Tag :color="record.status === '0' ? 'processing' : 'default'">
                {{ record.status === '0' ? '正常' : '停用' }}
              </Tag>
            </template>
          </template>
        </Table>
        <div class="mt-4 flex justify-end gap-2">
          <Button @click="closeSelectUserModal">取消</Button>
          <Button type="primary" :disabled="!selectedUnallocKeys.length" @click="handleConfirmSelectUser">确定</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { Input, Button, Tag, Popconfirm, Modal, Table } from 'ant-design-vue';
import type { PaginationProps } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import {
  getAuthUserAllocatedList,
  getAuthUserUnallocatedList,
  authUserCancel,
  authUserSelectAll,
  type AuthUserItem,
} from '#/api';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import BasicGridPage from '#/components/BasicGridPage.vue';

const route = useRoute();
const router = useRouter();

const roleId = computed(() => String(route.params.roleId ?? ''));

const gridRef = ref<InstanceType<typeof BasicGridPage> | null>(null);
const selectedRowKeys = ref<(string | number)[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  schema: [
    {
      component: 'Input',
      fieldName: 'userName',
      label: '用户名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入用户名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'phonenumber',
      label: '手机号码',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入手机号码',
      },
    },
  ],
};

const gridOptions: VxeTableGridOptions<AuthUserItem> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'userName', title: '用户名称', width: 120, align: 'center' },
    { field: 'nickName', title: '用户昵称', width: 120, align: 'center' },
    { field: 'email', title: '邮箱', minWidth: 180, align: 'center' },
    { field: 'phonenumber', title: '手机', width: 130, align: 'center' },
    { field: 'status', title: '状态', width: 90, align: 'center', slots: { default: 'status' } },
    { field: 'createTime', title: '创建时间', width: 180, align: 'center' },
    { field: 'action', title: '操作', width: 120, align: 'center', slots: { default: 'action' } },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        if (!roleId.value) {
          return {
            total: 0,
            items: [],
          };
        }
        const res = (await getAuthUserAllocatedList({
          roleId: roleId.value,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          userName: formValues.userName?.trim() || undefined,
          phonenumber: formValues.phonenumber?.trim() || undefined,
        })) as { total?: number; rows?: AuthUserItem[]; data?: { total?: number; rows?: AuthUserItem[] } };
        const data = res?.data ?? res;
        return {
          total: data?.total ?? 0,
          items: data?.rows ?? [],
        };
      },
    },
  },
};

const gridEvents = {
  checkboxChange: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: AuthUserItem) => item.userId as number);
  },
  checkboxAll: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: AuthUserItem) => item.userId as number);
  },
};

function handleClose() {
  router.back();
}

async function handleCancelOne(record: AuthUserItem) {
  try {
    const res = await authUserCancel({ userId: record.userId, roleId: roleId.value }) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '取消授权成功');
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '取消授权失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '取消授权失败');
  }
}

async function handleBatchCancel() {
  if (!selectedRowKeys.value.length) {
    message.warning('请勾选要取消授权的用户');
    return;
  }
  try {
    for (const uid of selectedRowKeys.value) {
      await authUserCancel({ userId: uid, roleId: roleId.value });
    }
    message.success('批量取消授权成功');
    selectedRowKeys.value = [];
    gridRef.value?.gridApi?.reload();
  } catch (e: any) {
    message.error(e?.message ?? '批量取消授权失败');
  }
}

// ---------- 选择用户弹框 ----------
const selectUserVisible = ref(false);
const unallocLoading = ref(false);
const unallocList = ref<AuthUserItem[]>([]);
const selectedUnallocKeys = ref<(string | number)[]>([]);
const unallocSearch = ref({ userName: '', phonenumber: '' });
const unallocPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (t: number) => `共 ${t} 条`,
  pageSizeOptions: ['10', '20', '50'],
});

const unallocColumns = [
  { title: '用户名称', dataIndex: 'userName', key: 'userName', width: 120, align: 'center' as const, ellipsis: true },
  { title: '用户昵称', dataIndex: 'nickName', key: 'nickName', width: 120, align: 'center' as const, ellipsis: true },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 200, align: 'center' as const, ellipsis: true },
  { title: '手机', dataIndex: 'phonenumber', key: 'phonenumber', width: 130, align: 'center' as const, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180, align: 'center' as const, ellipsis: true },
];

function openSelectUserModal() {
  selectUserVisible.value = true;
  selectedUnallocKeys.value = [];
  unallocSearch.value = { userName: '', phonenumber: '' };
  unallocPagination.current = 1;
  loadUnallocatedList();
}

function closeSelectUserModal() {
  selectUserVisible.value = false;
}

function resetUnallocSearch() {
  unallocSearch.value = { userName: '', phonenumber: '' };
  unallocPagination.current = 1;
  loadUnallocatedList();
}

function onUnallocTableChange(pag: PaginationProps) {
  unallocPagination.current = pag.current ?? 1;
  unallocPagination.pageSize = pag.pageSize ?? 10;
  loadUnallocatedList();
}

async function loadUnallocatedList() {
  if (!roleId.value) return;
  unallocLoading.value = true;
  try {
    const res = await getAuthUserUnallocatedList({
      roleId: roleId.value,
      pageNum: unallocPagination.current,
      pageSize: unallocPagination.pageSize,
      userName: unallocSearch.value.userName?.trim() || undefined,
      phonenumber: unallocSearch.value.phonenumber?.trim() || undefined,
    }) as { total?: number; rows?: AuthUserItem[]; data?: { total?: number; rows?: AuthUserItem[] } };

    const body = (res as any)?.data ?? res;
    const rows = body?.rows ?? [];
    const total = body?.total ?? rows.length;

    unallocList.value = rows;
    unallocPagination.total = total;
  } catch (e: any) {
    message.error(e?.message ?? '加载用户列表失败');
  } finally {
    unallocLoading.value = false;
  }
}

async function handleConfirmSelectUser() {
  if (!selectedUnallocKeys.value.length) {
    message.warning('请选择要添加的用户');
    return;
  }
  try {
    const res = await authUserSelectAll({ roleId: roleId.value, userIds: selectedUnallocKeys.value }) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '添加成功');
      closeSelectUserModal();
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '添加失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '添加失败');
  }
}

onMounted(() => {
  gridRef.value?.gridApi?.reload();
});
</script>

<style scoped>
.search-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}
.btn-search.ant-btn-primary { background-color: #1890ff; border-color: #1890ff; color: #fff; }
.btn-search.ant-btn-primary:hover { background-color: #40a9ff; border-color: #40a9ff; color: #fff; }
.btn-reset.ant-btn { background: #fff; border-color: #d9d9d9; color: rgba(0,0,0,0.65); }
.btn-reset.ant-btn:hover { border-color: #40a9ff; color: #40a9ff; }

.btn-add-user.ant-btn-primary { background-color: #40a9ff; border-color: #40a9ff; color: #fff; }
.btn-add-user.ant-btn-primary:hover { background-color: #69c0ff; border-color: #69c0ff; color: #fff; }
/* 批量取消授权：粉红/浅红色 */
.btn-batch-cancel.ant-btn { background-color: #ff7875; border-color: #ff7875; color: #fff; }
.btn-batch-cancel.ant-btn:hover { background-color: #ff9e9b; border-color: #ff9e9b; color: #fff; }
/* 关闭：黄色 */
.btn-close.ant-btn { background-color: #faad14; border-color: #faad14; color: #fff; }
.btn-close.ant-btn:hover { background-color: #ffc53d; border-color: #ffc53d; color: #fff; }

.link-cancel.ant-btn-link { color: #1890ff; }
.link-cancel.ant-btn-link:hover { color: #40a9ff; }
.link-cancel-icon { color: #1890ff; font-size: 14px; vertical-align: middle; }

/* 选择用户弹框：限制宽度，表格内容过长显示省略号 */
.select-user-modal-wrap :deep(.ant-modal-body) {
  max-width: 100%;
  overflow: hidden;
}
.select-user-modal .select-user-table :deep(.ant-table) {
  table-layout: fixed;
}
.select-user-modal .select-user-table :deep(.ant-table-thead > tr > th),
.select-user-modal .select-user-table :deep(.ant-table-tbody > tr > td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.select-user-modal .select-user-table :deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
  text-align: center;
}

.assign-user-table :deep(.ant-table-thead > tr > th),
.assign-user-table :deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
  text-align: center;
}
.assign-user-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background: #fafafa;
}
</style>
