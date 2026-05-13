<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sync_log"
    page-title="同步日志"
    page-desc="系统同步任务与结果记录"
    crud-prefix="/api/wms/crud/sync_log"
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
