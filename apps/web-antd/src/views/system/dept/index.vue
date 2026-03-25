<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-access:code="'system:dept:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button class="mr-2" @click="handleExpandAll">
          <IconifyIcon icon="material-symbols:expand-all" class="size-5" />
          {{ $t('page.system.dept.expandAll') }}
        </Button>
        <Button @click="handleCollapseAll">
          <IconifyIcon icon="material-symbols:collapse-all" class="size-5" />
          {{ $t('page.system.dept.collapseAll') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Switch
          :checked="row.status"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleStatusChange(row)"
        />
      </template>

      <template #action="{ row }">
        <Button v-access:code="'system:dept:add'" type="link" @click="handleAddChild(row)">{{ $t('page.system.dept.addChild') }}</Button>
        <Button v-access:code="'system:dept:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button v-access:code="'system:dept:delete'" type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>

    <DeptModal ref="modalRef" :dept-tree="deptTreeData" @success="handleReload" />
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
import { getDeptList, changeDeptStatus, deleteDept } from '#/api';
import DeptModal from './modules/dept-modal.vue';

const modalRef = ref();
const deptTreeData = ref<any[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'deptName',
      label: $t('page.system.dept.deptName'),
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
    { field: 'deptName', title: $t('page.system.dept.deptName'), treeNode: true, minWidth: 200 },
    { field: 'orderNum', title: $t('page.system.dept.orderNum'), width: 100, align: 'center' as const },
    { field: 'leader', title: $t('page.system.dept.leader'), minWidth: 120 },
    { field: 'phone', title: $t('page.system.dept.phone'), minWidth: 130 },
    { field: 'email', title: $t('page.system.dept.email'), minWidth: 180 },
    { field: 'status', title: $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 200 },
  ],
  height: 'auto',
  treeConfig: {
    transform: false,
    rowField: 'deptId',
    parentField: 'parentId',
    childrenField: 'children',
    expandAll: false,
  },
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getDeptList({
          pageNum: page?.currentPage,
          pageSize: page?.pageSize,
          ...formValues,
        });
        // 将扁平数组转换为树形结构
        const treeData = buildTree(res.rows || []);
        deptTreeData.value = treeData;
        return { rows: treeData };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 构建树形结构
const buildTree = (depts: any[]) => {
  const deptMap = new Map();
  const tree: any[] = [];

  // 先构建map
  depts.forEach((dept) => {
    deptMap.set(dept.deptId, { ...dept, children: [] });
  });

  // 再构建树
  depts.forEach((dept) => {
    const node = deptMap.get(dept.deptId);
    if (dept.parentId === 0 || !deptMap.has(dept.parentId)) {
      tree.push(node);
    } else {
      const parent = deptMap.get(dept.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return tree;
};

const handleAdd = () => modalRef.value?.open();
const handleEdit = (row: any) => modalRef.value?.open(row);
const handleAddChild = (row: any) => modalRef.value?.open({ parentId: row.deptId });
const handleReload = () => gridApi.reload();

// 展开/收起全部
const handleExpandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const handleCollapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

// 修改状态
const handleStatusChange = async (row: any) => {
  // :checked 已经改变了 row.status，直接使用
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(nextStatus === '1' ? 'page.system.dept.confirmDisable' : 'page.system.dept.confirmEnable', { name: row.deptName }),
    async onOk() {
      try {
        await changeDeptStatus({ deptId: row.deptId, status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
  });
};

// 删除
const handleDelete = async (row: any) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.system.dept.confirmDelete', { name: row.deptName }),
    async onOk() {
      await deleteDept(row.deptId);
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};
</script>
