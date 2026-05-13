<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_customs_list"
    page-title="报关列表"
    page-desc="报关相关单据列表"
    crud-prefix="/api/wms/crud/inv_customs_list"
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
