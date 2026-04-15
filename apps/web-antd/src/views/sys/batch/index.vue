<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_batch"
    :page-title="$t('page.wms.batch.listTitle')"
    :page-desc="$t('page.wms.batch.listDescription')"
    crud-prefix="/api/wms/crud/inv_batch"
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
