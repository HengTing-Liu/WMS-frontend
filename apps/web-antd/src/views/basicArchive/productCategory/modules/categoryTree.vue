<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { IconifyIcon } from '@vben/icons';
import { Input, Tree } from 'ant-design-vue';
interface TreeNode {
  id?: number;
  label?: string;
  disabled?: boolean;
  children?: TreeNode[];
}
const props = withDefaults(
  defineProps<{
    treeData: TreeNode[];
    searchPlaceholder?: string;
    /** 为 true 时根据 highlightNodeId 同步树高亮（分子页默认选中分类等） */
    syncHighlight?: boolean;
    /** 要高亮的节点 id，与接口树节点 id 一致；为 null/undefined 且 syncHighlight 时可清空高亮 */
    highlightNodeId?: string | number | null;
  }>(),
  {
    syncHighlight: false,
    highlightNodeId: undefined,
  },
);
const emit = defineEmits<{
  (e: 'select', node: TreeNode | null): void;
}>();
const searchValue = ref('');
const selectedKeys = ref<Array<string | number>>([]);
const sourceTreeData = ref<TreeNode[]>(props.treeData || []);
watch(
  () => props.treeData,
  (val) => {
    if (val && Array.isArray(val)) {
      sourceTreeData.value = val;
    }
  },
  { deep: true, immediate: true },
);
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.toLowerCase();
  const result: TreeNode[] = [];
  for (const node of nodes || []) {
    const label = String(node.label ?? '').toLowerCase();
    const children = Array.isArray(node.children) ? node.children : [];
    const matchedChildren = filterTree(children, query);
    const selfMatch = label.includes(q);
    if (selfMatch || matchedChildren.length) {
      result.push({
        ...node,
        children: matchedChildren,
      });
    }
  }
  return result;
}
const filteredTreeData = computed(() => {
  const q = searchValue.value?.trim();
  if (!q) return sourceTreeData.value;
  return filterTree(sourceTreeData.value, q);
});

watch(
  () => [props.syncHighlight, props.highlightNodeId] as const,
  ([syncHighlight, highlightNodeId]) => {
    if (!syncHighlight) return;
    if (highlightNodeId == null || highlightNodeId === '') {
      selectedKeys.value = [];
      return;
    }
    selectedKeys.value = [highlightNodeId];
  },
  { immediate: true },
);

const handleSelect = (_keys: Array<string | number>, info: any) => {
  const node = info?.node ?? null;
  if (!node) {
    selectedKeys.value = [];
    emit('select', null);
    return;
  }
  const nodeId = node?.id;
  selectedKeys.value = nodeId != null ? [nodeId] : [];
  emit('select', node);
};
</script>
<template>
  <div class="category-tree-wrapper rounded-md bg-white">
    <!-- 顶部搜索栏（固定区域） -->
    <div class="category-tree-search">
      <Input
        v-model:value="searchValue"
        :placeholder="searchPlaceholder || '请输入分类名称'"
      >
        <template #prefix>
          <IconifyIcon icon="icon-park-outline:search" />
        </template>
      </Input>
    </div>
    <!-- 树列表（滚动区域） -->
    <div class="category-tree-body">
      <Tree
        v-model:selectedKeys="selectedKeys"
        :autoExpandParent="true"
        :clickRowToExpand="false"
        :blockNode="true"
        :fieldNames="{ key: 'id', title: 'label' }"
        :show-line="true"
        :treeData="filteredTreeData"
        defaultExpandAll
        @select="handleSelect"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.category-tree-wrapper {
  height: 100%;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  .category-tree-search {
    padding: 12px 16px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .category-tree-body {
    flex: 1;
    padding: 8px 12px 12px;
    overflow-y: auto;
    /* 自定义滚动条（仅作用于当前树面板） */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.25);
      border-radius: 999px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
