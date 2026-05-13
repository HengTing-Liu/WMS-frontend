<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_adj_location"
    page-title="库位调整"
    page-desc="库位调整单查询与管理"
    crud-prefix="/api/wms/crud/inv_adj_location"
    @form-success="handleFormSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LowcodePage from '#/lowcode/LowcodePage.vue';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

function handleFormSuccess() {
  lowcodePageRef.value?.reload();
}
</script>
