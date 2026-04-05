<template>
  <DataPermissionCommon
    permission-type="company"
    key-field="companyId"
    :key-field-label="$t('page.dataPermission.company')"
    :list-api="getCompanyPermissionList"
    :detail-api="getCompanyPermissionDetail"
    :create-api="createCompanyPermission"
    :update-api="updateCompanyPermission"
    :delete-api="deleteCompanyPermission"
    :data-scope-options="dataScopeOptions"
    perm-prefix="wms:sys:data-permission:company"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDataScopeDict } from '#/api/sys/data-permission/user-permission';
import {
  getCompanyPermissionList,
  getCompanyPermissionDetail,
  createCompanyPermission,
  updateCompanyPermission,
  deleteCompanyPermission,
} from '#/api/sys/data-permission/company-permission';

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
