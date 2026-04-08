<template>
  <Drawer
    :title="$t('page.system.permission.assignPermTitle', { name: permissionName })"
    v-model:open="visible"
    width="600px"
    :body-style="{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 55px - 55px)' }"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <div class="flex flex-col flex-1 overflow-hidden">
      <div class="mb-4">
        <Checkbox v-model:checked="checkedStrictly">{{ $t('page.system.role.parentChildLinked') }}</Checkbox>
      </div>
      <div class="flex-1 overflow-auto">
        <Tree
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          :tree-data="menuTreeData"
          :checkable="true"
          :check-strictly="!checkedStrictly"
          :field-names="{ title: 'label', key: 'id', children: 'children' }"
          @check="handleCheck"
        />
      </div>
    </div>
    <template #footer>
      <Button class="mr-2" @click="handleCancel">{{ $t('page.common.cancel') }}</Button>
      <Button type="primary" :loading="loading" @click="handleSubmit">{{ $t('page.common.save') }}</Button>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Drawer, Tree, Button, Checkbox, message } from 'ant-design-vue';
import { $t } from '@vben/locales';
import { getPermissionMenuTree, assignPermissionMenu } from '#/api/system/permission';
import type { TreeProps } from 'ant-design-vue';

interface MenuTreeNode {
  id: number;
  key?: number;
  label: string;
  children?: MenuTreeNode[];
}

const visible = ref(false);
const loading = ref(false);
const treeLoading = ref(false);
const permissionId = ref<number>();
const permissionName = ref('');
const checkedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);
const checkedStrictly = ref(false);
const menuTreeData = ref<MenuTreeNode[]>([]);

const emit = defineEmits<{ (e: 'success'): void }>();

const open = async (row: any) => {
  visible.value = true;
  permissionId.value = row.menuId;
  permissionName.value = row.menuName;
  checkedKeys.value = [];
  expandedKeys.value = [];
  checkedStrictly.value = false;
  menuTreeData.value = [];
  treeLoading.value = true;
  try {
    const res = await getPermissionMenuTree(row.menuId);
    if (res) {
      menuTreeData.value = res.menus || [];
      checkedKeys.value = (res.checkedKeys || []).map(Number);
      expandedKeys.value = getAllNodeKeys(menuTreeData.value);
    }
  } catch (error) {
    console.error($t('page.common.loadRoleMenuFail'), error);
    message.error($t('page.message.loadFail'));
  } finally {
    treeLoading.value = false;
  }
};

const handleCheck: TreeProps['onCheck'] = (checked) => {
  console.log('onCheck', checked);
};

const getAllNodeKeys = (nodes: MenuTreeNode[]): number[] => {
  const keys: number[] = [];
  const traverse = (list: MenuTreeNode[]) => {
    for (const node of list) {
      keys.push(node.id);
      if (node.children?.length) traverse(node.children);
    }
  };
  traverse(nodes);
  return keys;
};

const handleSubmit = async () => {
  if (!permissionId.value) return;
  loading.value = true;
  try {
    let menuIds: number[] = [];
    if (Array.isArray(checkedKeys.value)) {
      menuIds = checkedKeys.value;
    } else if (checkedKeys.value && typeof checkedKeys.value === 'object') {
      const checked = (checkedKeys.value as any).checked || [];
      const halfChecked = (checkedKeys.value as any).halfChecked || [];
      menuIds = [...checked, ...halfChecked];
    }
    await assignPermissionMenu({ permissionId: permissionId.value, menuIds, checkStrictly: checkedStrictly.value });
    message.success($t('page.message.saveSuccess'));
    visible.value = false;
    emit('success');
  } catch {
    message.error($t('page.message.saveFail'));
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

const handleClose = () => {
  checkedKeys.value = [];
  expandedKeys.value = [];
  checkedStrictly.value = false;
  menuTreeData.value = [];
};

defineExpose({ open });
</script>