<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-access:code="'system:role:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Switch
          :checked="row.status"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleChangeStatus(row)"
        />
      </template>

      <template #action="{ row }">
        <Button v-access:code="'system:role:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button v-access:code="'system:role:assign'" type="link" @click="handleAssignMenu(row)">{{ $t('page.system.role.assignMenu') }}</Button>
        <Button v-access:code="'system:role:delete'" type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>

    <!-- 新增/编辑弹窗 -->
    <RoleModal ref="modalRef" @success="handleReload" />

    <!-- 分配菜单抽屉 -->
    <AssignMenuDrawer ref="menuDrawerRef" @success="handleReload" />
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Switch, Modal } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRoleList,
  deleteRole,
  changeRoleStatus,
} from '#/api';
import RoleModal from './modules/role-modal.vue';
import AssignMenuDrawer from './modules/assign-menu-drawer.vue';

const modalRef = ref();
const menuDrawerRef = ref();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: $t('page.system.role.roleName'),
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: $t('page.system.role.roleKey'),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.common.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.common.enabled'), value: '0' },
          { label: $t('page.common.disabled'), value: '1' },
        ],
      },
    },
  ],
};

const gridOptions = {
  columns: [
    { type: 'seq' as const, width: 60, title: $t('page.common.seq') },
    { field: 'roleName', title: $t('page.system.role.roleName'), minWidth: 150 },
    { field: 'roleKey', title: $t('page.system.role.roleKey'), minWidth: 150 },
    { field: 'roleSort', title: $t('page.system.role.roleSort'), width: 100, align: 'center' as const },
    { field: 'status', title: $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'createTime', title: $t('page.common.createTime'), width: 160, formatter: 'formatDateTime' },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 250 },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    response: {
      total: 'total',
      result: 'rows',
    },
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getRoleList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const handleAdd = () => modalRef.value?.open();
const handleEdit = (row: any) => modalRef.value?.open(row);
const handleReload = () => gridApi.reload();

// 修改状态
const handleChangeStatus = async (row: any) => {
  // :checked 已经改变了 row.status，直接使用
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(nextStatus === '1' ? 'page.system.role.confirmDisable' : 'page.system.role.confirmEnable', { name: row.roleName }),
    async onOk() {
      try {
        await changeRoleStatus({ roleId: row.roleId, status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
  });
};

// 分配菜单
const handleAssignMenu = (row: any) => {
  menuDrawerRef.value?.open(row);
};

// 删除
const handleDelete = async (row: any) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.system.role.confirmDelete', { name: row.roleName }),
    async onOk() {
      await deleteRole(String(row.roleId));
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};
</script>
