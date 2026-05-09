<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="io_inventory"
    page-title="领用退料入库"
    page-desc="查询和管理领用退料入库台账"
    crud-prefix="/api/wms/crud/io_inventory"
    permission-prefix="wms:inbound:return-material"
    :fixed-params="{ ioType: '退料入库' }"
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
