<template>
  <LowcodeTreePage
    ref="treePageRef"
    table-code="sys_dept"
    page-title="部门管理"
    :hide-tree-expand-icon="true"
    :crud-prefix="'/api/wms/crud/sys_dept'"
    :tree-config="{
      idField: 'deptId',
      parentIdField: 'parentId',
      rootValue: 0,
      titleField: 'deptName',
      defaultExpandAll: true,
    }"
    @add-child="handleAddChild"
    @create="handleCreate"
    @edit="handleEdit"
  >
    <!-- 使用原有的 DeptModal 处理新增/编辑/新增子部门 -->
    <DeptModal ref="deptModalRef" @success="handleModalSuccess" />
  </LowcodeTreePage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LowcodeTreePage } from '#/lowcode';
import type { LowcodeTreePageExposed } from '#/lowcode';
import type { DeptApi } from '#/api';
import DeptModal from './modules/deptModal.vue';

type DeptTreeNode = DeptApi.DeptTreeNode;

const treePageRef = ref<LowcodeTreePageExposed | null>(null);
const deptModalRef = ref<InstanceType<typeof DeptModal> | null>(null);

// ==================== 表单弹框处理 ====================
/** 新增顶级部门 */
function handleCreate() {
  const treeData = treePageRef.value?.treeData ?? [];
  deptModalRef.value?.modalApi.setData({
    addType: 'top',
    deptTreeOptions: treeData,
    onSuccess: () => treePageRef.value?.reload(),
  });
  deptModalRef.value?.modalApi.open();
}

/** 编辑部门 */
function handleEdit(record: DeptTreeNode) {
  const treeData = treePageRef.value?.treeData ?? [];
  deptModalRef.value?.modalApi.setData({
    record,
    deptTreeOptions: treeData,
    onSuccess: () => treePageRef.value?.reload(),
  });
  deptModalRef.value?.modalApi.open();
}

/** 新增子部门（树形特有） */
function handleAddChild(parentRecord: DeptTreeNode) {
  const treeData = treePageRef.value?.treeData ?? [];
  deptModalRef.value?.modalApi.setData({
    addType: 'row',
    parent: parentRecord,
    deptTreeOptions: treeData,
    onSuccess: () => treePageRef.value?.reload(),
  });
  deptModalRef.value?.modalApi.open();
}

function handleModalSuccess() {
  treePageRef.value?.reload();
}
</script>

<style scoped>
/* LowcodeTreePage 已在全局样式中处理 */
</style>
