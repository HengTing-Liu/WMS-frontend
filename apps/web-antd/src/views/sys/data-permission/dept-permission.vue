<template>
  <DataPermissionCommon
    permission-type="dept"
    key-field="deptId"
    :key-field-label="$t('page.dataPermission.dept')"
    :list-api="getDeptPermissionList"
    :detail-api="getDeptPermissionDetail"
    :create-api="createDeptPermission"
    :update-api="updateDeptPermission"
    :delete-api="deleteDeptPermission"
    :data-scope-options="dataScopeOptions"
    perm-prefix="wms:sys:data-permission:dept"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDataScopeDict } from '#/api/sys/data-permission/user-permission';
import {
  getDeptPermissionList,
  getDeptPermissionDetail,
  createDeptPermission,
  updateDeptPermission,
  deleteDeptPermission,
} from '#/api/sys/data-permission/dept-permission';

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
