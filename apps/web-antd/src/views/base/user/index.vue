<script setup lang="ts">
import BaseUser from '../../sys/user/index.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  // Props passed through
});

const component = BaseUser;
</script>

<template>
  <component :is="component" v-bind="$attrs" />
</template>
