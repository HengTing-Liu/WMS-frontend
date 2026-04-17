<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_location"
    :page-title="$t('page.wms.location.listTitle')"
    :page-desc="$t('page.wms.location.listDescription')"
    crud-prefix="/api/wms/crud/inv_location"
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
