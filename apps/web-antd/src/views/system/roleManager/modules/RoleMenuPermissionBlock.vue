<template>
  <div v-if="ctx" class="role-menu-permission-block">
    <!-- 与 dataScopeModal 数据权限区块一致：section-header + 标题 + 三个复选框，树放在带边框的 wrap 里 -->
    <div class="data-permission-section mb-4">
      <div class="section-header">
        <span class="section-title">菜单权限</span>
        <Checkbox
          :checked="ctx.expandAllChecked.value"
          class="ml-4"
          @change="ctx.onExpandCollapseChange"
        >
          展开/折叠
        </Checkbox>
        <Checkbox
          :checked="ctx.checkAllChecked.value"
          class="ml-4"
          @change="ctx.onCheckAllChange"
        >
          全选/全不选
        </Checkbox>
        <Checkbox
          :checked="ctx.linkParentChild.value"
          class="ml-4"
          @change="ctx.onLinkParentChildChange"
        >
          父子联动
        </Checkbox>
      </div>
      <div class="dept-tree-wrap">
        <Tree
          :checked-keys="ctx.linkParentChild.value ? ctx.checkedKeys.value : { checked: ctx.checkedKeys.value, halfChecked: [] }"
          :expanded-keys="ctx.expandedKeys.value"
          :tree-data="ctx.menuTreeData.value"
          :checkable="true"
          :check-strictly="!ctx.linkParentChild.value"
          :field-names="{ title: 'title', key: 'key', children: 'children' }"
          @check="(keys: any) => ctx.onTreeCheck(keys)"
          @expand="(keys: (string|number)[]) => ctx.onTreeExpand(keys)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { Tree, Checkbox } from 'ant-design-vue';

const ctx = inject<{
  menuTreeData: { value: { title: string; key: number; children?: any[] }[] };
  expandedKeys: { value: number[] };
  checkedKeys: { value: number[] };
  linkParentChild: { value: boolean };
  expandAllChecked: { value: boolean };
  checkAllChecked: { value: boolean };
  onExpandCollapseChange: (e: { target: { checked: boolean } }) => void;
  onCheckAllChange: (e: { target: { checked: boolean } }) => void;
  onLinkParentChildChange: (e: { target: { checked: boolean } }) => void;
  onTreeCheck: (keys: any) => void;
  onTreeExpand: (keys: (string | number)[]) => void;
}>('roleMenuPermissionContext');
</script>

<style scoped>
/* 与 dataScopeModal 数据权限区块样式一致 */
.role-menu-permission-block .data-permission-section .section-header {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.role-menu-permission-block .data-permission-section .section-title {
  font-weight: 500;
}
.role-menu-permission-block .data-permission-section .dept-tree-wrap {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
}
</style>
