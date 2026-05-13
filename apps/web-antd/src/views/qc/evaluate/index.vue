<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="qc_record"
    page-title="质量评价"
    page-desc="质检记录（qc_record）"
    crud-prefix="/api/wms/crud/qc_record"
    permission-prefix="wms:qc:evaluate"
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
