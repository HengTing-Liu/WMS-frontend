<template>
  <div class="sys-role-page">
    <LowcodePage
      ref="lowcodePageRef"
      table-code="sys_role"
      page-title="角色管理"
      page-desc="管理系统角色信息"
      crud-prefix="/api/wms/crud/sys_role"
      @form-success="handleFormSuccess"
    >
      <!-- 操作列追加「分配菜单」按钮 -->
      <template #appendAction="{ record }">
        <Button
          v-access:code="'system:role:assign'"
          type="link"
          size="small"
          class="p-0"
          @click="handleAssignMenu(record)"
        >
          分配菜单
        </Button>
      </template>
    </LowcodePage>

    <!-- 分配菜单抽屉 -->
    <AssignMenuDrawer ref="menuDrawerRef" @success="handleReload" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from 'ant-design-vue';
import LowcodePage from '#/lowcode/LowcodePage.vue';
import AssignMenuDrawer from './modules/assign-menu-drawer.vue';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);
const menuDrawerRef = ref<InstanceType<typeof AssignMenuDrawer> | null>(null);

function handleFormSuccess() {
  lowcodePageRef.value?.reload();
}

function handleReload() {
  lowcodePageRef.value?.reload();
}

function handleAssignMenu(record: Record<string, any>) {
  menuDrawerRef.value?.open(record);
}
</script>
