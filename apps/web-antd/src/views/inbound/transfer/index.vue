<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="io_inventory"
    page-title="调拨入库"
    page-desc="查询和管理调拨入库台账"
    crud-prefix="/api/wms/crud/io_inventory"
    permission-prefix="wms:inbound:transfer"
    :fixed-params="{ ioType: '调拨入库' }"
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
