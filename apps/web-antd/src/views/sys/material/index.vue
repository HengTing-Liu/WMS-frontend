<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sys_material"
    :page-title="$t('page.wms.material.listTitle')"
    :page-desc="$t('page.wms.material.listDescription')"
    crud-prefix="/api/wms/crud/sys_material"
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
