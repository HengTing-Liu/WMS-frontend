<template>
  <div class="p-5 bg-white">
    <BasicGridPage
      ref="gridRef"
      :form-options="formOptions"
      :grid-options="gridOptions"
      :grid-events="gridEvents"
    >
      <template #toolbar-tools>
        <Button class="btn-role-add" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="mr-1" />
          新增
        </Button>
        <Button class="btn-role-modify" :disabled="selectedRowKeys.length !== 1" @click="handleModify">
          <IconifyIcon icon="ep:edit" class="mr-1" />
          修改
        </Button>
        <Popconfirm
          title="是否确认删除所选角色?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <Button class="btn-role-delete" :disabled="!selectedRowKeys.length">
            <IconifyIcon icon="material-symbols:delete" class="mr-1" />
            删除
          </Button>
        </Popconfirm>
        <Button class="btn-role-export" @click="handleExport">
          <IconifyIcon icon="ant-design:download-outlined" class="mr-1" />
          导出
        </Button>
      </template>

      <template #dataScope="{ row }">
        <span class="cell-content">
          {{ dataScopeMap[row.dataScope ?? ''] ?? row.dataScope ?? '-' }}
        </span>
      </template>

      <template #status="{ row }">
        <span class="cell-content">
          <Switch
            :checked="row.status === '0'"
            :disabled="row.admin"
            @change="(checked: any) => handleStatusChange(row, !!checked)"
          />
        </span>
      </template>
      <template #action="{ row }">
        <span class="cell-content cell-action">
          <Button type="link" class="p-0 link-modify" @click="handleEdit(row as RoleItem)">
            <IconifyIcon icon="ep:edit" class="mr-1 align-middle" />
            修改
          </Button>
          <Popconfirm
            v-if="!(row as RoleItem).admin"
            title="是否确认删除该角色?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDelete(row as RoleItem)"
          >
            <Button danger type="link" class="p-0 link-delete">
              <IconifyIcon icon="material-symbols:delete-outline" class="mr-1 align-middle" />
              删除
            </Button>
          </Popconfirm>
          <Dropdown :trigger="['click']">
            <Button type="link" class="p-0 link-more">
              <IconifyIcon icon="icon-park:double-right" class="mr-1 align-middle" />
              更多
            </Button>
            <template #overlay>
              <Menu>
                <MenuItem @click="handleMoreClick(row as RoleItem, 'dataScope')">数据权限</MenuItem>
                <MenuItem @click="handleMoreClick(row as RoleItem, 'assignUser')">分配用户</MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </span>
      </template>
    </BasicGridPage>

    <RoleModal />
    <DataScopeModal />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { Button, Switch, DatePicker, Dropdown, Menu, Popconfirm } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, nowTimestamp } from '@vben/utils';
import { type Dayjs } from 'dayjs';
import { getRoleList, deleteRole, exportRole, changeRoleStatus } from '#/api';
import type { RoleApi } from '#/api';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import BasicGridPage from '#/components/BasicGridPage.vue';
import roleModal from './modules/roleModal.vue';
import dataScopeModal from './modules/dataScopeModal.vue';

const RangePicker = DatePicker.RangePicker;
const { Item: MenuItem } = Menu;
const router = useRouter();

const [RoleModal, roleModalApi] = useVbenModal({
    connectedComponent: roleModal,
});

const [DataScopeModal, dataScopeModalApi] = useVbenModal({
    connectedComponent: dataScopeModal,
});

type RoleItem = RoleApi.RoleItem;

const gridRef = ref<InstanceType<typeof BasicGridPage> | null>(null);
const selectedRowKeys = ref<number[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  fieldMappingTime: [['createTime', ['beginTime', 'endTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: '角色名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入角色名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: '权限字符',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入权限字符',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      formItemClass: 'col-span-1',
      labelWidth: 60,
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常', value: '0' },
          { label: '停用', value: '1' },
        ],
        placeholder: '角色状态',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: '创建时间',
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },
  ],
};

const statusOptions = [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' },
];

/** 数据范围：1全部 2自定义 3本部门 4本部门及以下（对应 data_scope） */
const dataScopeMap: Record<string, string> = {
  '1': '全部数据权限',
  '2': '自定义数据权限',
  '3': '本部门数据权限',
  '4': '本部门及以下数据权限',
};

const gridOptions: VxeTableGridOptions<RoleItem> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'roleId', title: '角色编号', width: 90, align: 'center' },
    { field: 'roleName', title: '角色名称', minWidth: 140, align: 'center' },
    { field: 'roleKey', title: '权限字符', minWidth: 140, align: 'center' },
    { field: 'roleSort', title: '显示顺序', width: 90, align: 'center' },
    { field: 'dataScope', title: '数据范围', minWidth: 160, align: 'center', slots: { default: 'dataScope' } },
    { field: 'status', title: '状态', width: 100, align: 'center', slots: { default: 'status' } },
    { field: 'createTime', title: '创建时间', minWidth: 170, align: 'center' },
    { field: 'remark', title: '备注', minWidth: 200, align: 'center', showOverflow: 'tooltip' },
    { field: 'action', title: '操作', width: 200, fixed: 'right', align: 'center', slots: { default: 'action' } },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          roleName: formValues.roleName?.trim() || undefined,
          roleKey: formValues.roleKey?.trim() || undefined,
          status: formValues.status,
          beginTime: formValues.beginTime,
          endTime: formValues.endTime,
        };
        const res = (await getRoleList(params as any)) as any;
        const data = res?.rows != null ? res : res?.data;
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
    selectedRowKeys.value = (params.records || []).map((item: RoleItem) => item.roleId as number);
  },
  checkboxAll: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: RoleItem) => item.roleId as number);
  },
};

function onSelectChange(keys: (string | number)[]) {
    selectedRowKeys.value = keys as number[];
}

function buildQueryParams() {
    const [begin, end] = searchForm.value.createTime ?? [];
    return {
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        roleName: searchForm.value.roleName?.trim() || undefined,
        roleKey: searchForm.value.roleKey?.trim() || undefined,
        status: searchForm.value.status,
        beginTime: begin ? begin.format('YYYY-MM-DD') : undefined,
        endTime: end ? end.format('YYYY-MM-DD') : undefined,
    };
}

async function loadList() {
    queryParams.value = buildQueryParams();
    loading.value = true;
    try {
        const res = await getRoleList(queryParams.value) as any;
        const data = res?.rows != null ? res : res?.data;
        dataList.value = data?.rows ?? [];
        pagination.total = data?.total ?? 0;
    } catch (e: any) {
        message.error(e?.message || '加载角色列表失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    pagination.pageNum = 1;
    loadList();
}

function handleReset() {
    searchForm.value = {
        roleName: '',
        roleKey: '',
        status: undefined,
        createTime: undefined,
    };
    pagination.pageNum = 1;
    loadList();
}

function onPaginationChange(page: number, pageSize: number) {
    pagination.pageNum = page;
    pagination.pageSize = pageSize;
    loadList();
}

function handleAdd() {
  const grid = gridRef.value?.gridApi?.grid;
  const roles = ((grid?.getTableData?.().fullData ?? []) as RoleItem[]) || [];
  roleModalApi
    .setData({
      roles,
      onSuccess: () => gridRef.value?.gridApi?.reload(),
    })
    .open();
}

function handleModify() {
  if (selectedRowKeys.value.length !== 1) return;
  const grid = gridRef.value?.gridApi?.grid;
  const roles = ((grid?.getTableData?.().fullData ?? []) as RoleItem[]) || [];
  const row = roles.find((r) => r.roleId === selectedRowKeys.value[0]);
  if (row) handleEdit(row);
}

function handleEdit(record: RoleItem) {
  const grid = gridRef.value?.gridApi?.grid;
  const roles = ((grid?.getTableData?.().fullData ?? []) as RoleItem[]) || [];
  roleModalApi
    .setData({
      roles,
      record,
      onSuccess: () => gridRef.value?.gridApi?.reload(),
    })
    .open();
}

async function handleStatusChange(record: RoleItem, checked: boolean) {
  const nextStatus = checked ? '0' : '1';
  try {
    const res = (await changeRoleStatus(record.roleId, nextStatus)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '状态修改成功');
      record.status = nextStatus;
    } else {
      message.error(res?.msg ?? '状态修改失败');
      gridRef.value?.gridApi?.reload();
    }
  } catch (e: any) {
    message.error(e?.message ?? '状态修改失败');
    gridRef.value?.gridApi?.reload();
  }
}

async function handleDelete(record: RoleItem) {
  try {
    const res = (await deleteRole(record.roleId)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '删除成功');
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '删除失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) {
    message.warning('请勾选要删除的角色');
    return;
  }
  try {
    const res = (await deleteRole(selectedRowKeys.value)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '删除成功');
      selectedRowKeys.value = [];
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '删除失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

async function handleExport() {
  try {
    const formValues = await gridRef.value?.gridApi?.formApi?.getValues?.();
    const [begin, end] = (formValues?.createTime ?? []) as [Dayjs, Dayjs] | [];

    const params = {
      roleName: formValues?.roleName?.trim() || undefined,
      roleKey: formValues?.roleKey?.trim() || undefined,
      status: formValues?.status,
      beginTime: begin ? begin.format('YYYY-MM-DD') : undefined,
      endTime: end ? end.format('YYYY-MM-DD') : undefined,
    };

    const blob = (await exportRole(params as any)) as Blob;
    downloadFileFromBlob({
      fileName: `角色列表${nowTimestamp()}.xlsx`,
      source: blob,
    });
    message.success('导出成功');
  } catch (e: any) {
    message.error(e?.message ?? '导出失败');
  }
}

function handleMoreClick(record: RoleItem, action: 'dataScope' | 'assignUser') {
    if (!record?.roleId) return;
    if (action === 'dataScope') {
        dataScopeModalApi.setData({ roleId: record.roleId, onSuccess: () => gridRef.value?.gridApi?.reload() }).open();
        return;
    }
    // 使用明确的路径跳转，避免 name 匹配不到动态路由
    router.push(`/roleManager/assignUser/${record.roleId}`);
}
</script>

<style scoped>

/* 搜索区：标签深灰色 */
.search-label {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
}
/* 搜索按钮：蓝色实心、白字白图标 */
.btn-role-search.ant-btn-primary {
    background-color: #1890ff;
    border-color: #1890ff;
    color: #fff;
}
.btn-role-search.ant-btn-primary:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
    color: #fff;
}
/* 重置按钮：白底、浅灰边框、深灰字 */
.btn-role-reset.ant-btn {
    background: #fff;
    border-color: #d9d9d9;
    color: rgba(0, 0, 0, 0.65);
}
.btn-role-reset.ant-btn:hover {
    border-color: #40a9ff;
    color: #40a9ff;
}

/* 工具栏：新增-浅蓝、修改-浅绿、删除-浅红、导出-浅橙 */
.btn-role-add.ant-btn {
    background-color: #40a9ff;
    border-color: #40a9ff;
    color: #fff;
    margin-right: 8px;
}
.btn-role-add.ant-btn:hover:not(:disabled) {
    background-color: #69c0ff;
    border-color: #69c0ff;
    color: #fff;
}

.btn-role-modify.ant-btn {
    background-color: #52c41a;
    border-color: #52c41a;
    color: #fff;
    margin-right: 8px;
}
.btn-role-modify.ant-btn:hover:not(:disabled) {
    background-color: #73d13d;
    border-color: #73d13d;
    color: #fff;
}
.btn-role-delete.ant-btn {
    background-color: #ff4d4f;
    border-color: #ff4d4f;
    color: #fff;
    margin-right: 8px;
}
.btn-role-delete.ant-btn:hover:not(:disabled) {
    background-color: #ff7875;
    border-color: #ff7875;
    color: #fff;
}
.btn-role-export.ant-btn {
    background-color: #faad14;
    border-color: #faad14;
    color: #fff;
}
.btn-role-export.ant-btn:hover {
    background-color: #ffc53d;
    border-color: #ffc53d;
    color: #fff;
}
/* 工具栏右侧：灰色圆形图标 */
.role-toolbar-right .btn-toolbar-icon.ant-btn {
    color: rgba(0, 0, 0, 0.45);
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.role-toolbar-right .btn-toolbar-icon.ant-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.65);
}

/* 表格 */
.role-manager-table :deep(.ant-table-thead > tr > th),
.role-manager-table :deep(.ant-table-tbody > tr > td) {
    padding: 14px 16px;
    text-align: center;
    color: rgba(0, 0, 0, 0.65);
}
.role-manager-table :deep(.ant-table-thead > tr > th) {
    font-weight: 600;
    background: #fafafa;
    color: rgba(0, 0, 0, 0.85);
}
.cell-content {
    display: inline-block;
    text-align: center;
}
.cell-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}
/* 操作列：修改-蓝色、删除-红色、更多-蓝色 */
.link-modify.ant-btn-link {
    color: #1890ff;
}
.link-modify.ant-btn-link:hover {
    color: #40a9ff;
}
.link-delete.ant-btn-link {
    color: #ff4d4f;
}
.link-delete.ant-btn-link:hover {
    color: #ff7875;
}
.link-more.ant-btn-link {
    color: #1890ff;
}
.link-more.ant-btn-link:hover {
    color: #40a9ff;
}

/* 分页：深灰文字，当前页蓝色 */
.role-pagination :deep(.ant-pagination-total-text),
.role-pagination :deep(.ant-pagination-options),
.role-pagination :deep(.ant-pagination-item a),
.role-pagination :deep(.ant-pagination-prev .ant-pagination-item-link),
.role-pagination :deep(.ant-pagination-next .ant-pagination-item-link) {
    color: rgba(0, 0, 0, 0.65);
}
.role-pagination :deep(.ant-pagination-item-active a) {
    color: #fff;
}
.role-pagination :deep(.ant-pagination-item-active) {
    background: #1890ff;
    border-color: #1890ff;
}
</style>
