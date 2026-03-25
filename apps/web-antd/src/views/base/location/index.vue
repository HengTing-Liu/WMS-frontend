<script setup lang="ts">
import BaseLocation from '../../sys/location/index.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  // Props passed through
});

const component = BaseLocation;
</script>

<template>
  <component :is="component" v-bind="$attrs" />
</template>
