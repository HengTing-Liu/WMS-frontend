<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="qc_standard"
    page-title="������׼"
    page-desc="���ڵʹ������ã���ѯ��ά�� qc_standard ������"
    crud-prefix="/api/wms/crud/qc_standard"
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
