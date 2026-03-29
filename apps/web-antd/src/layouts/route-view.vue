<template>
  <div class="route-view-full">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'RouteView' });
</script>

<style scoped>
.route-view-full {
  width: 100%;
  min-height: 100%;
  display: block;
}
</style>
