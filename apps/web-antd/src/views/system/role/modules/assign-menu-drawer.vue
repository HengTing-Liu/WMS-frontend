<template>
  <Drawer
    :title="$t('page.system.role.assignMenuTitle', { name: roleName })"
    v-model:open="visible"
    width="600px"
    :body-style="{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 55px - 55px)' }"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <div class="p-4 flex flex-col flex-1 overflow-hidden">
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
import { assignRoleMenu, getRoleMenuTree } from '#/api';
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
const roleId = ref<number>();
const roleName = ref('');
const checkedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);
const checkedStrictly = ref(false);
const menuTreeData = ref<MenuTreeNode[]>([]);

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const open = async (row: any) => {
  visible.value = true;
  roleId.value = row.roleId;
  roleName.value = row.roleName;
  checkedKeys.value = [];
  expandedKeys.value = [];
  checkedStrictly.value = false;
  menuTreeData.value = [];

  treeLoading.value = true;
  try {
    // 调用后端接口获取菜单树和已勾选菜单
    const res = await getRoleMenuTree(row.roleId);
    if (res) {
      // 后端返回: { checkedKeys: [...], menus: [...] }
      menuTreeData.value = res.menus || [];
      checkedKeys.value = (res.checkedKeys || []).map(Number);
      // 默认展开所有节点
      expandedKeys.value = getAllNodeKeys(menuTreeData.value);
    }
  } catch (error) {
    console.error($t('page.common.loadRoleMenuFail'), error);
    message.error($t('page.message.loadFail'));
  } finally {
    treeLoading.value = false;
  }
};

const handleCheck: TreeProps['onCheck'] = (checked, info) => {
  console.log('onCheck', checked, info);
};

/**
 * 递归获取所有节点的 key
 */
const getAllNodeKeys = (nodes: MenuTreeNode[]): number[] => {
  const keys: number[] = [];
  const traverse = (list: MenuTreeNode[]) => {
    for (const node of list) {
      keys.push(node.id);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return keys;
};

const handleSubmit = async () => {
  if (!roleId.value) return;

  loading.value = true;
  try {
    // 处理 Tree 组件在 check-strictly=false 时返回对象格式 { checked: [], halfChecked: [] }
    let menuIds: number[] = [];
    if (Array.isArray(checkedKeys.value)) {
      menuIds = checkedKeys.value;
    } else if (checkedKeys.value && typeof checkedKeys.value === 'object') {
      // 合并 checked 和 halfChecked
      const checked = (checkedKeys.value as any).checked || [];
      const halfChecked = (checkedKeys.value as any).halfChecked || [];
      menuIds = [...checked, ...halfChecked];
    }

    await assignRoleMenu({
      roleId: roleId.value,
      menuIds,
      menuCheckStrictly: checkedStrictly.value,
    });
    message.success($t('page.message.saveSuccess'));
    visible.value = false;
    emit('success');
  } catch (error) {
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
