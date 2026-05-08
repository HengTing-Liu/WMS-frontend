<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_inventory_change"
    page-title="库存流水"
    page-desc="查询库存变动流水记录"
    crud-prefix="/api/wms/crud/inv_inventory_change"
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
