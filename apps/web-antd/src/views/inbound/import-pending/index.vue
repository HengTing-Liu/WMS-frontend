<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_import_pending"
    page-title="进口待处理"
    page-desc="进口业务待处理单据列表"
    crud-prefix="/api/wms/crud/inv_import_pending"
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
