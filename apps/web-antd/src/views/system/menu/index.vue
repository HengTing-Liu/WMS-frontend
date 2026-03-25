<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-access:code="'system:menu:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button class="mr-2" @click="handleExpandAll">
          <IconifyIcon icon="material-symbols:expand-all" class="size-5" />
          {{ $t('page.system.menu.expandAll') }}
        </Button>
        <Button @click="handleCollapseAll">
          <IconifyIcon icon="material-symbols:collapse-all" class="size-5" />
          {{ $t('page.system.menu.collapseAll') }}
        </Button>
      </template>

      <template #icon="{ row }">
        <IconifyIcon v-if="row.icon" :icon="row.icon" class="size-5" />
        <span v-else>-</span>
      </template>

      <template #menuType="{ row }">
        <Tag v-if="row.menuType === 'M'" color="blue">{{ $t('page.system.menu.typeDirectory') }}</Tag>
        <Tag v-else-if="row.menuType === 'C'" color="green">{{ $t('page.system.menu.typeMenu') }}</Tag>
        <Tag v-else color="orange">{{ $t('page.system.menu.typeButton') }}</Tag>
      </template>

      <template #visible="{ row }">
        <Switch
          v-if="row.menuId !== 1"
          v-access:code="'system:menu:edit'"
          :checked="row.visible"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleVisibleChange(row)"
        />
        <span v-else>-</span>
      </template>

      <template #status="{ row }">
        <Switch
          v-if="row.menuId !== 1"
          v-access:code="'system:menu:edit'"
          :checked="row.status"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleStatusChange(row)"
        />
        <span v-else>-</span>
      </template>

      <template #action="{ row }">
        <Button v-if="row.menuType !== 'F'" v-access:code="'system:menu:add'" type="link" @click="handleAddChild(row)">{{ $t('page.system.menu.addChild') }}</Button>
        <Button v-access:code="'system:menu:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button v-if="row.menuId !== 1" v-access:code="'system:menu:delete'" type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>

    <MenuModal ref="modalRef" :menu-tree="menuTreeData" @success="handleReload" />
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
import { getMenuList, changeMenuStatus, changeMenuVisible, deleteMenu } from '#/api';
import MenuModal from './modules/menu-modal.vue';

const modalRef = ref();
const menuTreeData = ref<any[]>([]);
const expandState = ref(false);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'menuName',
      label: $t('page.system.menu.menuName'),
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
    { field: 'menuName', title: $t('page.system.menu.menuName'), treeNode: true, minWidth: 200 },
    { field: 'icon', title: $t('page.system.menu.icon'), width: 80, slots: { default: 'icon' }, align: 'center' as const },
    { field: 'orderNum', title: $t('page.system.menu.orderNum'), width: 80, align: 'center' as const },
    { field: 'path', title: $t('page.system.menu.path'), minWidth: 150 },
    { field: 'component', title: $t('page.system.menu.component'), minWidth: 200 },
    { field: 'perms', title: $t('page.system.menu.perms'), minWidth: 150 },
    { field: 'menuType', title: $t('page.system.menu.menuType'), width: 100, slots: { default: 'menuType' } },
    { field: 'visible', title: $t('page.system.menu.visible'), width: 100, slots: { default: 'visible' } },
    { field: 'status', title: $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 200 },
  ],
  height: 'auto',
  treeConfig: {
    transform: false,
    rowField: 'menuId',
    parentField: 'parentId',
    childrenField: 'children',
    expandAll: true,
  },
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getMenuList({
          pageNum: page?.currentPage,
          pageSize: page?.pageSize,
          ...formValues,
        });
        // API 返回 { total, rows }，rows 是扁平数组
        // 需要转换成树形结构
        const treeData = buildTree(res.rows || []);
        menuTreeData.value = treeData;
        return { rows: treeData };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 构建树形结构
const buildTree = (menus: any[]) => {
  const menuMap = new Map();
  const tree: any[] = [];

  // 先构建map
  menus.forEach((menu) => {
    menuMap.set(menu.menuId, { ...menu, children: [] });
  });

  // 再构建树
  menus.forEach((menu) => {
    const node = menuMap.get(menu.menuId);
    if (menu.parentId === 0 || !menuMap.has(menu.parentId)) {
      tree.push(node);
    } else {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return tree;
};

const handleAdd = () => modalRef.value?.open();
const handleEdit = (row: any) => modalRef.value?.open(row);
const handleAddChild = (row: any) => modalRef.value?.open({ parentId: row.menuId });
const handleReload = () => gridApi.reload();

// 展开/收起全部
const handleExpandAll = () => {
  expandState.value = true;
  gridApi.grid?.setAllTreeExpand(true);
};

const handleCollapseAll = () => {
  expandState.value = false;
  gridApi.grid?.setAllTreeExpand(false);
};

// 修改显示状态
const handleVisibleChange = async (row: any) => {
  // :checked 已经改变了 row.visible，直接使用
  const nextVisible = row.visible;
  try {
    await changeMenuVisible({ menuId: row.menuId, visible: nextVisible });
    message.success($t('page.message.operationSuccess'));
    gridApi.reload();
  } catch (error) {
    message.error($t('page.message.operationFail'));
  }
};

// 修改启用状态
const handleStatusChange = async (row: any) => {
  // :checked 已经改变了 row.status，直接使用
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(nextStatus === '1' ? 'page.system.menu.confirmDisable' : 'page.system.menu.confirmEnable', { name: row.menuName }),
    async onOk() {
      try {
        await changeMenuStatus({ menuId: row.menuId, status: nextStatus });
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
    content: $t('page.system.menu.confirmDelete', { name: row.menuName }),
    async onOk() {
      await deleteMenu(row.menuId);
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};
</script>
