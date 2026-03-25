
<script lang="ts" setup>
  import { computed,  watch, ref } from 'vue';
  import { Tree,Input } from 'ant-design-vue';
  import { IconifyIcon } from '@vben/icons';

  interface TreeNode {
  id?: number;
  label?: string;
  disabled?: boolean;
  children?: TreeNode[];
}
  const props=defineProps(['treeData'])
  const emit = defineEmits(['select']);
  const searchValue = ref<string>('');
  const sourceTreeData = ref<TreeNode[]>(props.treeData );
  watch(
    () => props.treeData,
    (val) => {
      if (val && Array.isArray(val)) {
        sourceTreeData.value = val;
      }
    },
    { deep: true, immediate: true },
  );

  function filterTree(nodes: TreeNode[], query: string): any[] {
    const q = query.toLowerCase();
    const result: any[] = [];
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
  const expandedKeys = computed(() => {
    const keys: Array<string | number> = [];
    const walk = (nodes: any[]) => {
      for (const n of nodes || []) {
        keys.push(n.id);
        if (Array.isArray(n.children) && n.children.length) {
          walk(n.children);
        }
      }
    };
    walk(filteredTreeData.value || []);
    return keys;
  });

  const handleSelect = (keys: Array<string | number>) => {
    emit('select', keys[0]);
  }
</script>
<template>
   <div class="bg-white p-4 rounded-md ">
    <div class="mb-4">
      <Input v-model:value="searchValue" :placeholder="$t('page.common.inputDeptName')">
        <template #prefix>
          <IconifyIcon icon="icon-park-outline:search" />
        </template>
      </Input>
    </div>
      <Tree
        :title="$t('page.common.orgStructure')"
        toolbar
        search
        defaultExpandAll
        :autoExpandParent="true"
        :show-line="true"
        :fieldNames="{ key: 'id', title: 'label' }"
        :clickRowToExpand="false"
        :treeData="filteredTreeData"
        :expandedKeys="expandedKeys"
        @select="handleSelect"
      />
   </div>
</template>
