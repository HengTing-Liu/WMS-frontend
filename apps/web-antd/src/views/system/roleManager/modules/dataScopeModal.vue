<template>
  <Modal
    :title="title"
    class="data-scope-modal-wrap"
    width="560px"
  >
    <div v-if="loading" class="py-8 text-center text-gray-500">加载中...</div>
    <template v-else>
      <!-- 角色名称、权限字符、权限范围（与数据库 sys_role 一致） -->
      <div class="data-scope-form mb-4">
        <div class="form-row mb-3">
          <span class="form-label">角色名称</span>
          <Input v-model:value="roleName" disabled class="form-input form-input-readonly" />
        </div>
        <div class="form-row mb-3">
          <span class="form-label">权限字符</span>
          <Input v-model:value="roleKey" disabled class="form-input form-input-readonly" />
        </div>
        <div class="form-row mb-3">
          <span class="form-label">权限范围</span>
          <Select
            v-model:value="dataScope"
            class="form-input"
            :options="dataScopeOptions"
            placeholder="请选择权限范围"
          />
        </div>
      </div>

      <!-- 数据权限：仅当权限范围=自定数据权限(2)时展示 -->
      <div v-if="dataScope === '2'" class="data-permission-section mb-4">
        <div class="section-header">
          <span class="section-title">数据权限</span>
          <Checkbox v-model:checked="expandAllChecked" class="ml-4" @change="onExpandCollapseChange">
            展开/折叠
          </Checkbox>
          <Checkbox v-model:checked="checkAllChecked" class="ml-4" @change="onCheckAllChange">
            全选/全不选
          </Checkbox>
          <Checkbox v-model:checked="linkParentChild" class="ml-4">父子联动</Checkbox>
        </div>
        <div class="dept-tree-wrap">
          <Tree
            v-model:checkedKeys="checkedKeys"
            :tree-data="deptTreeData"
            :checkable="true"
            :check-strictly="!linkParentChild"
            :expanded-keys="expandedKeys"
            :field-names="{ title: 'title', key: 'key', children: 'children' }"
            @update:expanded-keys="onTreeExpand"
          />
        </div>
      </div>

      <!-- 确定、取消 -->
      <div class="flex justify-end gap-2 pt-2">
        <Button class="btn-cancel" @click="handleCancel">取消</Button>
        <Button type="primary" class="btn-confirm" :loading="submitting" @click="handleSubmit">确定</Button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Input, Select, Checkbox, Tree, Button } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import { getRoleDetail, getRoleDeptTree, updateRoleDataScope } from '#/api';
import type { RoleDeptTreeNode } from '#/api';

// 与 sys_role.data_scope 注释一致：1全部 2自定义 3本部门 4本部门及以下（截图显示「自定数据权限」）
const dataScopeOptions = [
  { label: '全部数据权限', value: '1' },
  { label: '自定数据权限', value: '2' },
  { label: '本部门数据权限', value: '3' },
  { label: '本部门及以下数据权限', value: '4' },
  { label: '仅本人数据权限', value: '5' },
];

const title = ref('分配数据权限');
const visible = ref(false);
const loading = ref(false);
const submitting = ref(false);

const roleId = ref<number | string>('');
const roleName = ref('');
const roleKey = ref('');
const dataScope = ref('1');
const roleDetail = ref<Record<string, any> | null>(null);

const deptTreeData = ref<{ key: number; title: string; children?: any[] }[]>([]);
const expandedKeys = ref<(string | number)[]>([]);
const checkedKeys = ref<(string | number)[]>([]);
const expandAllChecked = ref(false);
const checkAllChecked = ref(false);
const linkParentChild = ref(true);
const allDeptKeys = ref<number[]>([]);
const parentMap = ref<Record<number, number | null>>({});

let onSuccessCallback: (() => void) | undefined;

watch(checkedKeys, syncCheckAllChecked, { deep: true });

function deptToTreeData(nodes: RoleDeptTreeNode[]): { key: number; title: string; children?: any[] }[] {
  parentMap.value = {};
  if (!nodes?.length) return [];
  function walk(list: RoleDeptTreeNode[], parentId: number | null): { key: number; title: string; children?: any[] }[] {
    return list.map((n) => {
      parentMap.value[n.id] = parentId;
      return {
        key: n.id,
        title: n.label,
        children: n.children?.length ? walk(n.children, n.id) : undefined,
      };
    });
  }
  return walk(nodes, null);
}

function collectAllKeys(nodes: { key: number; children?: any[] }[]): number[] {
  const ids: number[] = [];
  function walk(list: { key: number; children?: any[] }[]) {
    list.forEach((n) => {
      ids.push(n.key);
      if (n.children?.length) walk(n.children);
    });
  }
  walk(nodes);
  return ids;
}

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen: boolean) {
    visible.value = isOpen;
    if (!isOpen) return;
    const payload = modalApi.getData<{ roleId: number | string; onSuccess?: () => void }>();
    if (!payload?.roleId) return;
    roleId.value = payload.roleId;
    onSuccessCallback = payload.onSuccess;
    loading.value = true;
    Promise.all([
      getRoleDetail(payload.roleId),
      getRoleDeptTree(payload.roleId),
    ])
      .then(([detailRes, treeRes]) => {
        // 角色详情：兼容 res.data 或 res.data.data
        const inner = (detailRes as any)?.data ?? detailRes;
        const data = inner?.data ?? inner;
        if (data && typeof data === 'object') {
          roleDetail.value = { ...data };
          roleName.value = data.roleName ?? '';
          roleKey.value = data.roleKey ?? '';
          dataScope.value = data.dataScope ?? '1';
          linkParentChild.value = data.deptCheckStrictly === false;
        }

        // 部门树：接口返回 { code, depts, checkedKeys }，depts/checkedKeys 在顶层
        const body = (treeRes as any)?.data ?? treeRes;
        const depts = Array.isArray(body?.depts) ? body.depts : [];
        const keys = Array.isArray(body?.checkedKeys) ? body.checkedKeys : [];
        deptTreeData.value = deptToTreeData(depts);
        allDeptKeys.value = collectAllKeys(deptTreeData.value);
        checkedKeys.value = keys;
        expandedKeys.value = [];
        expandAllChecked.value = false;
        syncCheckAllChecked();
      })
      .catch((e: any) => {
        message.error(e?.message ?? '加载数据失败');
      })
      .finally(() => {
        loading.value = false;
      });
  },
});

function handleCancel() {
  modalApi.close();
}

function onExpandCollapseChange(e: { target: { checked: boolean } }) {
  expandAllChecked.value = !!e?.target?.checked;
  expandedKeys.value = expandAllChecked.value ? [...allDeptKeys.value] : [];
}

function syncCheckAllChecked() {
  const all = allDeptKeys.value;
  const raw = checkedKeys.value;
  const current = Array.isArray(raw) ? raw : (raw as any)?.checked ?? [];
  const set = new Set(current);
  checkAllChecked.value = all.length > 0 && all.every((k) => set.has(k));
}

function onCheckAllChange(e: { target: { checked: boolean } }) {
  const checked = !!e?.target?.checked;
  checkAllChecked.value = checked;
  checkedKeys.value = checked ? [...allDeptKeys.value] : [];
}

function onTreeExpand(keys: (string | number)[]) {
  expandedKeys.value = keys;
  expandAllChecked.value = keys.length >= allDeptKeys.value.length;
}

async function handleSubmit() {
  if (!roleId.value) return;
  submitting.value = true;
  try {
    const raw = checkedKeys.value;
    const selectedDeptIds: number[] = Array.isArray(raw) ? (raw as number[]) : ((raw as any)?.checked ?? []);

    // 如果开启了“父子联动”，需要把所有选中节点的父节点ID一并传给后端
    const finalDeptIdSet = new Set<number>(selectedDeptIds);
    if (linkParentChild.value && dataScope.value === '2') {
      for (const id of selectedDeptIds) {
        let current = id;
        // 逐级向上查找父节点，直到根节点
        while (parentMap.value[current] != null) {
          const parentId = parentMap.value[current] as number;
          if (finalDeptIdSet.has(parentId)) break;
          finalDeptIdSet.add(parentId);
          current = parentId;
        }
      }
    }
    const finalDeptIds = Array.from(finalDeptIdSet);

    // 后端需要“角色详情整对象”+ 当前选择
    const payload: Record<string, any> = {
      ...(roleDetail.value ?? {}),
      roleId: roleId.value,
      roleName: roleName.value,
      roleKey: roleKey.value,
      dataScope: dataScope.value,
      // 父子联动：勾选=联动 => deptCheckStrictly=false；不勾选 => true
      deptCheckStrictly: !linkParentChild.value,
      // 只有自定数据权限时提交 deptIds，否则置空，且隐藏树
      deptIds: dataScope.value === '2' ? finalDeptIds : [],
    };

    const res = (await updateRoleDataScope(payload)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '保存成功');
      onSuccessCallback?.();
      modalApi.close();
    } else {
      message.error(res?.msg ?? '保存失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '保存失败');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open: modalApi.open, close: modalApi.close });
</script>

<style scoped>
.data-scope-form .form-label {
  display: inline-block;
  width: 80px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  margin-right: 8px;
  text-align: right;
}
.data-scope-form .form-input {
  width: 280px;
}
.data-permission-section .section-header {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.data-permission-section .section-title {
  font-weight: 500;
}
.form-input-readonly.ant-input:disabled {
  background-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.65);
  cursor: not-allowed;
}
.dept-tree-wrap {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
}
.btn-cancel.ant-btn {
  background: #fff;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.65);
}
.btn-cancel.ant-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}
.btn-confirm.ant-btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.btn-confirm.ant-btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
  color: #fff;
}
</style>
