<script setup lang="ts">
import BasePermission from '../../sys/permission/index.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  // Props passed through
});

const component = BasePermission;
</script>

<template>
  <component :is="component" v-bind="$attrs" />
</template>
