<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_purchase_order"
    page-title="采购订单"
    page-desc="查询和管理采购订单信息"
    crud-prefix="/api/wms/crud/inv_purchase_order"
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
