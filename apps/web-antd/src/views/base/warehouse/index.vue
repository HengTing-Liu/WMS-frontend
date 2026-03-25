<script setup lang="ts">
import BaseWarehouse from '../../sys/warehouse/index.vue';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  // Props passed through
});

const component = BaseWarehouse;
</script>

<template>
  <component :is="component" v-bind="$attrs" />
</template>
