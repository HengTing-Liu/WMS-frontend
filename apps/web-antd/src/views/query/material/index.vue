<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_inventory"
    page-title="查询库位余量"
    crud-prefix="/api/wms/crud/inv_inventory"
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
