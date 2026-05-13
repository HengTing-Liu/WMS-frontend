<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="inv_stocktake"
    page-title="库存盘点"
    page-desc="库存盘点单查询与管理"
    crud-prefix="/api/wms/crud/inv_stocktake"
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
