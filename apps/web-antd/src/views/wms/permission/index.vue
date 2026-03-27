<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="'wms:permission:add'"
          type="primary"
          class="mr-2"
          @click="handleAdd"
        >
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button
          v-access:code="'wms:permission:export'"
          @click="handleExport"
        >
          <IconifyIcon icon="material-symbols:download" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Switch
          :checked="row.isEnabled === 1"
          :checkedValue="1"
          :unCheckedValue="0"
          @change="() => handleChangeStatus(row)"
        />
      </template>

      <template #menuType="{ row }">
        <Tag :color="NODE_TYPE_CONFIG[row.menuType]?.tagColor || 'default'">
          {{ $t(NODE_TYPE_CONFIG[row.menuType]?.label || 'page.wms.permission.typeCatalog') }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Button v-access:code="'wms:permission:edit'" type="link" @click="handleEdit(row)">
          {{ $t('page.common.edit') }}
        </Button>
        <Button v-access:code="'wms:permission:assign'" type="link" @click="handleAssign(row)">
          {{ $t('page.wms.permission.assignPerm') }}
        </Button>
        <Button v-access:code="'wms:permission:delete'" type="link" danger @click="handleDelete(row)">
          {{ $t('page.common.delete') }}
        </Button>
      </template>
    </Grid>

    <!-- Add/Edit Modal -->
    <PermissionModal ref="modalRef" @success="handleReload" />

    <!-- Assign Permission Drawer -->
    <PermissionDrawer ref="drawerRef" @success="handleReload" />
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Switch, Tag, Modal } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getPermissionTree,
  deletePermission,
  changePermissionStatus,
} from '#/api/wms/permission';
import { exportPermission } from '#/api/wms/permission';
import PermissionModal from '../../sys/permission/modules/permission-modal.vue';
import PermissionDrawer from '../../sys/permission/modules/permission-drawer.vue';
import { NODE_TYPE_CONFIG } from '../../sys/permission/types/permission';

const modalRef = ref();
const drawerRef = ref();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'permissionCode',
      label: $t('page.wms.permission.permissionCode'),
    },
    {
      component: 'Input',
      fieldName: 'permissionName',
      label: $t('page.wms.permission.permissionName'),
    },
    {
      component: 'Select',
      fieldName: 'menuType',
      label: $t('page.wms.permission.permissionType'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.wms.permission.typeCatalog'), value: 'C' },
          { label: $t('page.wms.permission.typeMenu'), value: 'M' },
          { label: $t('page.wms.permission.typeButton'), value: 'F' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'isEnabled',
      label: $t('page.common.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.common.enabled'), value: 1 },
          { label: $t('page.common.disabled'), value: 0 },
        ],
      },
    },
  ],
};

const gridOptions = {
  columns: [
    { type: 'seq', width: 60, title: $t('page.common.seq') },
    { field: 'permissionCode', title: $t('page.wms.permission.permissionCode'), minWidth: 150 },
    { field: 'permissionName', title: $t('page.wms.permission.permissionName'), minWidth: 150 },
    { field: 'menuType', title: $t('page.wms.permission.permissionType'), width: 120, slots: { default: 'menuType' } },
    { field: 'sort', title: $t('page.wms.permission.sort'), width: 80, align: 'center' },
    { field: 'isEnabled', title: $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'remark', title: $t('page.common.remark'), minWidth: 150 },
    { field: 'createTime', title: $t('page.wms.permission.createTime'), width: 180, formatter: 'formatDateTime' },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right', slots: { default: 'action' }, width: 250 },
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
        const res = await getPermissionTree({
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

// Change status
const handleChangeStatus = async (row: any) => {
  const nextStatus = row.isEnabled === 1 ? 0 : 1;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(
      nextStatus === 1 ? 'page.wms.permission.confirmEnable' : 'page.wms.permission.confirmDisable',
      { name: row.permissionName }
    ),
    async onOk() {
      try {
        await changePermissionStatus({ permissionId: row.permissionId || row.menuId, status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
  });
};

// Assign permissions
const handleAssign = (row: any) => {
  drawerRef.value?.open(row);
};

// Delete
const handleDelete = async (row: any) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.wms.permission.confirmDelete', { name: row.permissionName }),
    async onOk() {
      await deletePermission(String(row.permissionId || row.menuId));
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};

// Export
async function handleExport() {
  try {
    const formValues = gridApi.formValues || {};
    const blob = await exportPermission(formValues);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `permissions_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    console.error('Export failed:', error);
    message.error($t('page.message.exportFail'));
  }
}
</script>
