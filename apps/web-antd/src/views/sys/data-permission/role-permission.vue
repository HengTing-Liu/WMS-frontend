<template>
  <DataPermissionCommon
    permission-type="role"
    key-field="roleId"
    :key-field-label="$t('page.system.dataPermission.role')"
    :list-api="getRolePermissionList"
    :detail-api="getRolePermissionDetail"
    :create-api="createRolePermission"
    :update-api="updateRolePermission"
    :delete-api="deleteRolePermission"
    :data-scope-options="dataScopeOptions"
    perm-prefix="wms:sys:data-permission:role"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDataScopeDict } from '#/api/sys/data-permission/user-permission';
import {
  getRolePermissionList,
  getRolePermissionDetail,
  createRolePermission,
  updateRolePermission,
  deleteRolePermission,
} from '#/api/sys/data-permission/role-permission';

// 权限范围字典
const dataScopeOptions = ref<Array<{ label: string; value: string }>>([]);

// 加载权限范围字典
async function loadDataScopeDict() {
  try {
    const res = await getDataScopeDict();
    dataScopeOptions.value = res.data || [];
  } catch (error) {
    // Error handling
  }
}

onMounted(() => {
  loadDataScopeDict();
});
</script>
