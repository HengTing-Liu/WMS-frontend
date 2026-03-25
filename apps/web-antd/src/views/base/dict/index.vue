<script setup lang="ts">
import SysDict from '../../sys/dict/index.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  // Props passed through
});

const component = SysDict;
</script>

<template>
  <component :is="component" v-bind="$attrs" />
</template>
