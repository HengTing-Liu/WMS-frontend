
<script lang="ts" setup>
  import { computed, watch, ref } from 'vue';
  import { Tree, Input, Checkbox, Button, Tooltip } from 'ant-design-vue';
  import { IconifyIcon } from '@vben/icons';
  import { MinusSquare, PlusSquare } from 'lucide-vue-next';

  interface TreeNode {
    /** 部门主键：接口可能为 number 或 string（如业务编码），不可强转 Number 否则整表被丢弃 */
    id?: string | number;
    label?: string;
    disabled?: boolean;
    /** 部门编码全路径 */
    deptCodeFullpath?: string;
    children?: TreeNode[];
  }
  const props = defineProps(['treeData']);
  const emit = defineEmits(['select']);
  const searchValue = ref<string>('');
  const sourceTreeData = ref<TreeNode[]>([]);

  type FlatDeptRow = {
    idKey: string;
    parentKey: string;
    label: string;
    disabled: boolean;
    deptCodeFullpath: string;
  };

  function toDeptKey(v: any): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  }

/** 展示格式：部门编码 + 半角空格 + 部门名称（与部门管理树列一致） */
  function pickDeptCode(node: any): string {
    const raw =
      node?.deptCode ??
      node?.dept_code ??
      node?.departmentCode ??
      node?.department_code ??
      node?.orgCode ??
      node?.org_code ??
      node?.code;
    if (raw === null || raw === undefined) return '';
    const s = String(raw).trim();
    return s;
  }

  function pickDeptName(node: any): string {
    const raw = node?.deptName ?? node?.dept_name;
    if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
      return String(raw).trim();
    }
    // TreeSelect / 低代码接口没有 deptName 时，直接用 label
    const lab = node?.label;
    if (lab !== null && lab !== undefined && String(lab).trim() !== '') {
      return String(lab).trim();
    }
    return '';
  }

  function buildLabel(node: any): string {
    const code = pickDeptCode(node);
    const name = pickDeptName(node);
    if (code && name) return `${code} ${name}`;
    if (code) return code;
    if (name) return name;
    const idRaw = node?.deptId ?? node?.id;
    return idRaw != null ? String(idRaw) : '';
  }

  /**
   * 将接口返回的「嵌套树」或「扁平列表」统一摊平成带 parentId 的行（嵌套时以 DFS 父节点为准，避免漏节点）
   */
  function collectAllDeptRows(raw: any[]): FlatDeptRow[] {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const list: FlatDeptRow[] = [];

    const walk = (nodes: any[], parentFromTree: string | null) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        const idKey = toDeptKey(node.deptId ?? node.id);
        if (!idKey) continue;

        let parentKey = '0';
        if (parentFromTree !== null) {
          parentKey = parentFromTree;
        } else {
          const pk = toDeptKey(node.parentId ?? node.parent_id);
          parentKey = pk ?? '0';
        }

        // 提取部门编码全路径（支持多种字段名格式）
        const deptCodeFullpath = String(
          node?.deptCodeFullpath ??
          node?.dept_code_fullpath ??
          node?.dept_code_full_path ??
          node?.deptFullPath ??
          node?.dept_full_path ??
          node?.fullPath ??
          ''
        ).trim();
        list.push({
          idKey,
          parentKey,
          label: buildLabel(node),
          disabled: Boolean(node?.disabled),
          deptCodeFullpath,
        });

        const ch = node?.children;
        if (Array.isArray(ch) && ch.length > 0) {
          walk(ch, idKey);
        }
      }
    };

    walk(raw, null);

    const byId = new Map<string, FlatDeptRow>();
    for (const row of list) {
      byId.set(row.idKey, row);
    }
    return Array.from(byId.values());
  }

  /** 按 parentId 组装为树，并排序同级节点（按 deptCodeFullpath 升序） */
  function buildHierarchyFromRows(rows: FlatDeptRow[]): TreeNode[] {
    if (!rows.length) return [];
    const sorted = [...rows].sort((a, b) => {
      if (a.parentKey !== b.parentKey) return a.parentKey.localeCompare(b.parentKey, undefined, { numeric: true });
      // 使用 deptCodeFullpath 排序，如果为空则用 deptCode（通过 label 提取）
      const aSortKey = a.deptCodeFullpath || a.label || '';
      const bSortKey = b.deptCodeFullpath || b.label || '';
      return aSortKey.localeCompare(bSortKey, undefined, { numeric: true });
    });

    const map = new Map<string, TreeNode>();
    for (const n of sorted) {
      map.set(n.idKey, {
        id: n.idKey,
        label: n.label,
        disabled: n.disabled,
        deptCodeFullpath: n.deptCodeFullpath,
        children: [],
      });
    }

    const roots: TreeNode[] = [];
    for (const n of sorted) {
      const node = map.get(n.idKey);
      if (!node) continue;
      const pid = n.parentKey;
      if (pid !== '0' && map.has(pid)) {
        map.get(pid)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    function sortChildren(nodes: TreeNode[]) {
      nodes.sort(
        (a, b) => {
          const aSortKey = a.deptCodeFullpath || a.label || '';
          const bSortKey = b.deptCodeFullpath || b.label || '';
          return aSortKey.localeCompare(bSortKey, undefined, { numeric: true });
        },
      );
      for (const x of nodes) {
        if (x.children?.length) sortChildren(x.children);
      }
    }
    sortChildren(roots);
    return roots;
  }

  function normalizeDeptTreeInput(raw: any[]): TreeNode[] {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const flat = collectAllDeptRows(raw);
    return buildHierarchyFromRows(flat);
  }

  watch(
    () => props.treeData,
    (val) => {
      if (val && Array.isArray(val)) {
        sourceTreeData.value = normalizeDeptTreeInput(val);
      } else {
        sourceTreeData.value = [];
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

  const includeSubDept = ref<boolean>(true);
  const expandedKeys = ref<(string | number)[]>([]);
  const isAllExpanded = ref(true);

  // 收集所有可展开的节点 key
  function collectAllExpandableKeys(nodes: TreeNode[]): (string | number)[] {
    const keys: (string | number)[] = [];
    function walk(list: TreeNode[]) {
      for (const n of list) {
        if (n.children && n.children.length > 0) {
          if (n.id != null) keys.push(n.id);
          walk(n.children);
        }
      }
    }
    walk(nodes);
    return keys;
  }

  // 初始化展开状态
  function initExpandedKeys() {
    if (isAllExpanded.value) {
      expandedKeys.value = collectAllExpandableKeys(sourceTreeData.value);
    } else {
      expandedKeys.value = [];
    }
  }

  // 切换展开/折叠
  function toggleExpandAll() {
    isAllExpanded.value = !isAllExpanded.value;
    initExpandedKeys();
  }

  // 监听树数据变化时重新初始化展开状态
  watch(
    () => sourceTreeData.value,
    () => {
      initExpandedKeys();
    },
    { deep: true }
  );

  function collectDescendantIds(nodes: TreeNode[], targetId: string | number): (string | number)[] {
    const findNode = (list: TreeNode[]): TreeNode | null => {
      for (const n of list) {
        if (n.id === targetId) return n;
        if (n.children?.length) {
          const f = findNode(n.children);
          if (f) return f;
        }
      }
      return null;
    };
    const target = findNode(nodes);
    if (!target) return targetId != null ? [targetId] : [];
    const result: (string | number)[] = [];
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        if (n.id != null) result.push(n.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk([target]);
    return result;
  }

  const selectedKeys = ref<(string | number)[]>([]);

  function doEmitSelect(keys: (string | number)[]) {
    const targetId = keys[0];
    if (targetId == null) {
      emit('select', [], includeSubDept.value);
      return;
    }
    if (includeSubDept.value) {
      const ids = collectDescendantIds(sourceTreeData.value, targetId);
      emit('select', ids.length ? ids : [targetId], includeSubDept.value);
    } else {
      emit('select', [targetId], includeSubDept.value);
    }
  }

  watch(selectedKeys, (keys, oldKeys) => {
    if (!keys || keys.length === 0) {
      if (oldKeys && oldKeys.length > 0) {
        // 重复点击已选中节点导致取消选中，恢复之前状态
        selectedKeys.value = [...oldKeys];
        return;
      }
      emit('select', []);
      return;
    }
    doEmitSelect(keys);
  });

  // 切换“包含下级”时，若已选中部门则重新查询
  watch(includeSubDept, () => {
    if (selectedKeys.value.length > 0) {
      doEmitSelect(selectedKeys.value);
    }
  });
</script>
<template>
   <div class="bg-white p-4 rounded-md h-full flex flex-col min-h-0">
    <div class="mb-2 flex items-center justify-between">
      <div class="text-sm font-medium text-gray-700">部门架构</div>
      <div class="flex items-center gap-1">
        <Tooltip :title="isAllExpanded ? '折叠全部' : '展开全部'">
          <Button
            type="text"
            size="small"
            class="!p-1"
            @click="toggleExpandAll"
          >
            <template #icon>
              <MinusSquare v-if="isAllExpanded" class="w-4 h-4" />
              <PlusSquare v-else class="w-4 h-4" />
            </template>
          </Button>
        </Tooltip>
      </div>
    </div>
    <div class="mb-2">
      <Checkbox v-model:checked="includeSubDept">包含下级部门</Checkbox>
    </div>
    <div class="mb-4">
      <Input v-model:value="searchValue" placeholder="请输入部门名称">
        <template #prefix>
          <IconifyIcon icon="icon-park-outline:search" />
        </template>
      </Input>
    </div>
    <div class="flex-1 min-h-0 overflow-auto">
      <Tree
        :expanded-keys="expandedKeys"
        :auto-expand-parent="false"
        show-line
        show-icon
        :field-names="{ key: 'id', title: 'label' }"
        :click-row-to-expand="false"
        :tree-data="filteredTreeData"
        block-node
        v-model:selectedKeys="selectedKeys"
        @update:expanded-keys="(keys: (string | number)[]) => expandedKeys = keys"
      />
    </div>
   </div>
</template>
